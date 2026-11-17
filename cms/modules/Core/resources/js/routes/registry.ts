import { useSyncExternalStore } from 'react';
import { AppRoute } from './types';

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

export const registerRoutes = (route: AppRoute | AppRoute[]): void => {
    const state = getGlobalState();
    const incoming = Array.isArray(route) ? route : [route];
    let nextRoutes = [...state.routes];

    for (const r of incoming) {
        const existingIndex = nextRoutes.findIndex((existing) => existing.path === r.path);
        if (existingIndex >= 0) {
            nextRoutes[existingIndex] = r;
        } else {
            nextRoutes.push(r);
        }
    }

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
