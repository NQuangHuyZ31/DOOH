import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '../../Core/config/config.js';
import type { MiddlewareHandler, RouteContext } from '../../Core/router/router.js';
import { sendError } from '../../Core/utils/httpUtil.js';
import type { AuthContext, AuthPolicy, AuthRouteRule } from '../types/auth.types.js';
import { AuthService, defaultAuthService } from '../services/authService.js';
import { extractApiKey, extractScreenKey, extractSignatureHeaders } from '../utils/hmacUtil.js';

const normalizePrefix = (raw: string): string => '/' + raw.replace(/^\/+|\/+$/g, '');

export const buildDefaultAuthRules = (apiPrefix: string = config.apiPrefix): AuthRouteRule[] => {
	const base = normalizePrefix(apiPrefix);
	return [
		{ prefix: '/', exact: true, policy: 'public' },
		{ prefix: '/health', exact: true, policy: 'public' },
		{ prefix: `${base}/log/`, policy: 'public' },
		{ prefix: `${base}/partner/`, policy: 'vendor' },
		{ prefix: `${base}/player/`, policy: 'screen' },
		{ prefix: `${base}/delivery/`, policy: 'screen_or_vendor' },
		{ prefix: `${base}/venue/`, policy: 'screen_or_vendor' },
	];
};

export const DEFAULT_AUTH_RULES: AuthRouteRule[] = buildDefaultAuthRules();

const resolveScreenCode = (ctx: RouteContext): string | null => {
	const fromParam = ctx.params.code || ctx.params.screen_code;
	if (fromParam && fromParam.trim().length > 0) return fromParam.trim();
	const fromQuery = ctx.query.get('screen_code') || ctx.query.get('code');
	return fromQuery && fromQuery.trim().length > 0 ? fromQuery.trim() : null;
};

const resolvePolicy = (pathname: string, rules: AuthRouteRule[], apiPrefix: string): AuthPolicy => {
	for (const rule of rules) {
		if (rule.exact ? pathname === rule.prefix : pathname.startsWith(rule.prefix)) {
			return rule.policy;
		}
	}
	return pathname.startsWith(`${normalizePrefix(apiPrefix)}/`) ? 'screen_or_vendor' : 'public';
};

export const requireVendorAuth = (service: AuthService = defaultAuthService): MiddlewareHandler => {
	return async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => {
		const result = await service.authenticateVendor(extractApiKey(req));
		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}
		ctx.auth = result.auth;
		await next();
	};
};

export const requireScreenAuth = (service: AuthService = defaultAuthService): MiddlewareHandler => {
	return async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => {
		const result = await service.authenticateScreen(extractScreenKey(req), resolveScreenCode(ctx));
		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}
		ctx.auth = result.auth;
		await next();
	};
};

export const requireScreenOrVendorAuth = (service: AuthService = defaultAuthService): MiddlewareHandler => {
	return async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => {
		const screenKey = extractScreenKey(req);
		const apiKey = extractApiKey(req);

		const result = screenKey
			? await service.authenticateScreen(screenKey, resolveScreenCode(ctx))
			: await service.authenticateVendor(apiKey);

		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}
		ctx.auth = result.auth;
		await next();
	};
};

export const requireHmacSignature = (service: AuthService = defaultAuthService, secretResolver?: (ctx: RouteContext) => string | null): MiddlewareHandler => {
	return async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => {
		const { signature, timestamp } = extractSignatureHeaders(req);
		const auth = ctx.auth as AuthContext | undefined;
		const secret = secretResolver ? secretResolver(ctx) : auth?.type === 'screen' ? auth.screen.secret_key : null;

		if (!secret) {
			sendError(res, 401, 'Unauthorized: signing secret unavailable');
			return;
		}

		const canonicalPayload = `${(req.method || 'GET').toUpperCase()}:${ctx.pathname}`;
		const result = service.verifyRequestSignature(canonicalPayload, signature, timestamp, secret);
		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}
		await next();
	};
};

export interface AuthGuardOptions {
	service?: AuthService;
	rules?: AuthRouteRule[];
	apiPrefix?: string;
}

export const createAuthGuard = (options: AuthGuardOptions = {}): MiddlewareHandler => {
	const service = options.service ?? defaultAuthService;
	const apiPrefix = options.apiPrefix ?? config.apiPrefix;
	const rules = options.rules ?? buildDefaultAuthRules(apiPrefix);
	const vendorMw = requireVendorAuth(service);
	const screenMw = requireScreenAuth(service);
	const dualMw = requireScreenOrVendorAuth(service);

	return async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => {
		const policy = resolvePolicy(ctx.pathname, rules, apiPrefix);
		if (policy === 'public') {
			await next();
			return;
		}
		if (policy === 'vendor') {
			await vendorMw(req, res, ctx, next);
			return;
		}
		if (policy === 'screen') {
			await screenMw(req, res, ctx, next);
			return;
		}
		await dualMw(req, res, ctx, next);
	};
};
