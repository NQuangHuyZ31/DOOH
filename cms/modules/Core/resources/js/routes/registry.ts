import { useMemo, useSyncExternalStore } from 'react';
import type { AuthUser } from '@modules/Auth/resources/js/types/auth';
import { useAppSelector } from '../store/hooks';
import { hasRoutePermission } from '../utils/permission';
import { buildMenuTree } from './buildMenuTree';
import { isAdminRoute, isMenuVisibleRoute, type AppRoute, type RouteDef } from './types';

export type { AppRoute, RouteDef };

interface GlobalRouteRegistryState {
    routes: readonly AppRoute[];
    listeners: Set<() => void>;
}

const getGlobalState = (): GlobalRouteRegistryState => {
    const win = (typeof window !== 'undefined' ? window : globalThis) as unknown as {
        __CMS_ROUTES_REGISTRY__?: GlobalRouteRegistryState;
    };
    return (win.__CMS_ROUTES_REGISTRY__ ??= {
        routes: [],
        listeners: new Set(),
    });
};

const emitChange = (): void => {
    getGlobalState().listeners.forEach((listener) => listener());
};

export const subscribeRoutes = (listener: () => void): (() => void) => {
    const state = getGlobalState();
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
};

function flattenRoutesWithChildren(route: AppRoute): AppRoute[] {
    const cleanPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
    const normalized: AppRoute = {
        layout: 'main',
        order: 100,
        ...route,
        path: cleanPath,
    };

    const result: AppRoute[] = [normalized];
    const nested = route.subMenu ?? route.children ?? [];

    for (const child of nested) {
        const childWithParent: AppRoute = {
            ...child,
            parentPath: child.parentPath ?? cleanPath,
        };
        result.push(...flattenRoutesWithChildren(childWithParent));
    }

    return result;
}

export const registerRoute = (route: AppRoute): void => {
    registerRoutes([route]);
};

export const registerRoutes = (route: AppRoute | AppRoute[]): void => {
    const state = getGlobalState();
    const incoming = Array.isArray(route) ? route : [route];
    const nextRoutes = [...state.routes];

    for (const item of incoming) {
        const expanded = flattenRoutesWithChildren(item);
        for (const r of expanded) {
            const existingIndex = nextRoutes.findIndex((existing) => existing.path === r.path);
            if (existingIndex >= 0) {
                nextRoutes[existingIndex] = r;
            } else {
                nextRoutes.push(r);
            }
        }
    }

    nextRoutes.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    state.routes = nextRoutes;
    emitChange();
};

export const getRegisteredRoutes = (): AppRoute[] => {
    return [...getGlobalState().routes];
};

export const useRegisteredRoutes = (): readonly AppRoute[] => {
    return useSyncExternalStore(
        subscribeRoutes,
        () => getGlobalState().routes,
        () => getGlobalState().routes
    );
};

export const getMenuRoutes = (user?: AuthUser | null): AppRoute[] => {
    return buildMenuTree(getGlobalState().routes, user);
};

export const useMenuRoutes = (): AppRoute[] => {
    const routes = useRegisteredRoutes();
    const user = useAppSelector((state) => state.auth.user);
    return useMemo(() => buildMenuTree(routes, user), [routes, user]);
};

export const getDefaultRoutePath = (user?: AuthUser | null): string => {
    const routes = getGlobalState().routes;
    const isAccessible = (r: AppRoute) => (user === undefined ? true : hasRoutePermission(user, r));

    const firstMenuRoute = routes.find(
        (r) => isMenuVisibleRoute(r) && Boolean(r.element || r.component) && isAccessible(r)
    );
    if (firstMenuRoute) {
        return firstMenuRoute.path;
    }

    const firstAdminRoute = routes.find(
        (r) => isAdminRoute(r) && Boolean(r.element || r.component) && isAccessible(r)
    );

    return firstAdminRoute?.path || '/admin/venues';
};

export const getLoginRoutePath = (): string => {
    const routes = getGlobalState().routes;
    const guestRoute = routes.find((r) => r.layout === 'guest' || r.layout === 'bare');

    return guestRoute?.path || '/admin/login';
};
