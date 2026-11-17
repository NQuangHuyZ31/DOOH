import { AppRoute } from './types';

class RouteRegistry {
  private routes: AppRoute[] = [];

  public register(route: AppRoute | AppRoute[]): void {
    const incoming = Array.isArray(route) ? route : [route];
    for (const r of incoming) {
      if (!this.routes.some((existing) => existing.path === r.path)) {
        this.routes.push(r);
      }
    }
  }

  public getRoutes(): AppRoute[] {
    return this.routes;
  }

  public clear(): void {
    this.routes = [];
  }
}

export const routeRegistry = new RouteRegistry();

export const registerRoutes = (routes: AppRoute | AppRoute[]): void => {
  routeRegistry.register(routes);
};

export const getRegisteredRoutes = (): AppRoute[] => {
  return routeRegistry.getRoutes();
};

export default routeRegistry;
