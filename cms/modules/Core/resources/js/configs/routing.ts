export interface MenuItemConfig {
    key: string;
    path: string;
    label: string;
}

export const ROUTING_CONFIG = {
    adminPrefix: (import.meta.env.VITE_ADMIN_PREFIX as string) || '/admin',
    apiPrefix: (import.meta.env.VITE_API_PREFIX as string) || '/admin/api',
    defaultPath: '/admin/venues',
    defaultModule: 'venues',
    auth: {
        tokenKey: 'auth_token',
        loginPath: '/admin/login',
    },
    modules: {
        venues: { key: 'venues', path: '/admin/venues', label: 'Venues (Screens)' },
        delivery: { key: 'delivery', path: '/admin/delivery', label: 'Delivery (Campaigns)' },
        creatives: { key: 'creatives', path: '/admin/creatives', label: 'Creative Hub' },
        simulator: { key: 'simulator', path: '/admin/simulator', label: 'Screen Simulator' },
        reports: { key: 'reports', path: '/admin/reports', label: 'Reports & Analytics' },
        logs: { key: 'logs', path: '/admin/logs', label: 'Tracking Logs' },
    },
} as const;

export default ROUTING_CONFIG;
