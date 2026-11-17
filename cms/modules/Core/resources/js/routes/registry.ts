import { AppRoute } from './types';

class RouteRegistry {
  private routes: AppRoute[] = [];

  public register(route: AppRoute | AppRoute[]): void {
    if (Array.isArray(route)) {
      this.routes.push(...route);
    } else {
      this.routes.push(route);
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
