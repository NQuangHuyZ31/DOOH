import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RouteContext {
	params: Record<string, string>;
	query: URLSearchParams;
	pathname: string;
	auth?: unknown;
}

export type RouteHandler = (req: IncomingMessage, res: ServerResponse, ctx: RouteContext) => Promise<void> | void;

export type MiddlewareHandler = (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, next: () => Promise<void>) => Promise<void> | void;

interface RouteDefinition {
	method: string;
	pattern: RegExp;
	paramNames: string[];
	middlewares: MiddlewareHandler[];
	handler: RouteHandler;
}

export interface MatchedRoute {
	handler: RouteHandler;
	middlewares: MiddlewareHandler[];
	params: Record<string, string>;
}

export class Router {
	private routes: RouteDefinition[] = [];
	private middlewares: MiddlewareHandler[] = [];

	public use(middleware: MiddlewareHandler): this {
		this.middlewares.push(middleware);
		return this;
	}

	public add(method: string, path: string, handlerOrMiddlewares: RouteHandler | MiddlewareHandler[], maybeHandler?: RouteHandler): this {
		const routeMiddlewares = Array.isArray(handlerOrMiddlewares) ? handlerOrMiddlewares : [];
		const handler = Array.isArray(handlerOrMiddlewares) ? maybeHandler : handlerOrMiddlewares;
		if (!handler) {
			throw new Error(`Route handler is required for ${method.toUpperCase()} ${path}`);
		}

		const paramNames: string[] = [];
		const regexStr = '^' + path.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
			paramNames.push(name);
			return '([^/]+)';
		}) + '$';

		this.routes.push({
			method: method.toUpperCase(),
			pattern: new RegExp(regexStr),
			paramNames,
			middlewares: routeMiddlewares,
			handler,
		});
		return this;
	}

	public get(path: string, handlerOrMiddlewares: RouteHandler | MiddlewareHandler[], maybeHandler?: RouteHandler): this {
		return this.add('GET', path, handlerOrMiddlewares, maybeHandler);
	}

	public post(path: string, handlerOrMiddlewares: RouteHandler | MiddlewareHandler[], maybeHandler?: RouteHandler): this {
		return this.add('POST', path, handlerOrMiddlewares, maybeHandler);
	}

	public put(path: string, handlerOrMiddlewares: RouteHandler | MiddlewareHandler[], maybeHandler?: RouteHandler): this {
		return this.add('PUT', path, handlerOrMiddlewares, maybeHandler);
	}

	public delete(path: string, handlerOrMiddlewares: RouteHandler | MiddlewareHandler[], maybeHandler?: RouteHandler): this {
		return this.add('DELETE', path, handlerOrMiddlewares, maybeHandler);
	}

	public mount(prefix: string, subRouter: Router): this {
		const cleanPrefix = prefix.replace(/\/+$/, '');
		for (const route of subRouter.routes) {
			const subRegexSrc = route.pattern.source.replace(/^\^/, '').replace(/\$$/, '');
			this.routes.push({
				method: route.method,
				pattern: new RegExp('^' + cleanPrefix + subRegexSrc + '$'),
				paramNames: [...route.paramNames],
				middlewares: [...subRouter.middlewares, ...route.middlewares],
				handler: route.handler,
			});
		}
		return this;
	}

	public match(method: string, pathname: string): MatchedRoute | null {
		const normalizedMethod = method.toUpperCase();
		for (const route of this.routes) {
			if (route.method !== normalizedMethod) continue;
			const match = route.pattern.exec(pathname);
			if (match) {
				const params: Record<string, string> = {};
				for (let i = 0; i < route.paramNames.length; i++) {
					params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
				}
				return { handler: route.handler, middlewares: [...this.middlewares, ...route.middlewares], params };
			}
		}
		return null;
	}
}
