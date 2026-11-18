import type { ComponentType, ReactNode } from 'react';

export interface AppRoute {
  /** Route path, e.g. '/admin/venues' */
  path: string;
  /** React element to render */
  element?: ReactNode;
  /** Or React component class/function to render */
  component?: ComponentType;
  /** Optional unique route key */
  key?: string;
  /** Page/document title (also used as Sidebar label if `label` is omitted) */
  title?: string;
  /** Sidebar menu label */
  label?: string;
  /** Hide this route from Sidebar menu even if `label` or `title` is set */
  hideInMenu?: boolean;
  /** Sidebar menu icon (ReactNode or AntD Icon component) */
  icon?: ReactNode | ComponentType;
  /** Sort order in Sidebar menu (default: 100) */
  order?: number;
  /** Layout wrapper ('main' | 'admin' use MainLayout; 'guest' | 'bare' use GuestGuard) */
  layout?: 'main' | 'admin' | 'guest' | 'bare';
  /** Module slug for permission filtering */
  module?: string;
	/** Permission action (default: 'view') */
	action?: string;
	/** Explicit permission name or list of permissions */
	permission?: string | string[];
	/** Required roles */
	roles?: string[];
  /** SubMenu Option 1: attach this route under a parent route's path */
  parentPath?: string;
  /** SubMenu Option 2: nested child routes */
  subMenu?: AppRoute[];
  /** Alias for subMenu */
  children?: AppRoute[];
}

export type RouteDef = AppRoute;

export function isAdminRoute(route: AppRoute): boolean {
  return route.layout !== 'guest' && route.layout !== 'bare';
}

export function isMenuVisibleRoute(route: AppRoute): boolean {
  return isAdminRoute(route) && !route.hideInMenu && Boolean(route.label || route.title);
}
