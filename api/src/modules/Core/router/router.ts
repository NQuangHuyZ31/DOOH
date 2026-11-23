import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RouteContext {
	params: Record<string, string>;
	query: URLSearchParams;
}

export type RouteHandler = (req: IncomingMessage, res: ServerResponse, ctx: RouteContext) => Promise<void> | void;

export type MiddlewareHandler = (req: IncomingMessage, res: ServerResponse, next: () => Promise<void>) => Promise<void>;

interface RouteDefinition {
	method: string;
	pattern: RegExp;
	paramNames: string[];
	handler: RouteHandler;
}

export class Router {
	private routes: RouteDefinition[] = [];
	private middlewares: MiddlewareHandler[] = [];

	public use(middleware: MiddlewareHandler): this {
		this.middlewares.push(middleware);
		return this;
	}

	public add(method: string, path: string, handler: RouteHandler): this {
		const paramNames: string[] = [];
		const regexStr = '^' + path.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
			paramNames.push(name);
			return '([^/]+)';
		}) + '$';

		this.routes.push({
			method: method.toUpperCase(),
			pattern: new RegExp(regexStr),
			paramNames,
			handler,
		});
		return this;
	}

	public get(path: string, handler: RouteHandler): this { return this.add('GET', path, handler); }
	public post(path: string, handler: RouteHandler): this { return this.add('POST', path, handler); }
	public put(path: string, handler: RouteHandler): this { return this.add('PUT', path, handler); }
	public delete(path: string, handler: RouteHandler): this { return this.add('DELETE', path, handler); }

	public mount(prefix: string, subRouter: Router): this {
		const cleanPrefix = prefix.replace(/\/+$/, '');
		for (const route of subRouter.routes) {
			const subRegexSrc = route.pattern.source.replace(/^\^/, '').replace(/\$$/, '');
			this.routes.push({
				method: route.method,
				pattern: new RegExp('^' + cleanPrefix + subRegexSrc + '$'),
				paramNames: [...route.paramNames],
				handler: route.handler,
			});
		}
		return this;
	}

	public match(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null {
		const normalizedMethod = method.toUpperCase();
		for (const route of this.routes) {
			if (route.method !== normalizedMethod) continue;
			const match = route.pattern.exec(pathname);
			if (match) {
				const params: Record<string, string> = {};
				for (let i = 0; i < route.paramNames.length; i++) {
					params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
				}
				return { handler: route.handler, params };
			}
		}
		return null;
	}
}
