import type { AuthUser } from '@modules/Auth/resources/js/types/auth';
import { hasRoutePermission } from '../utils/permission';
import { isMenuVisibleRoute, type AppRoute } from './types';

function normalizeSubMenu(
	children?: AppRoute[],
	user?: AuthUser | null,
): AppRoute[] {
	if (!children || children.length === 0) return [];
	return children
		.filter(isMenuVisibleRoute)
		.map((child) => {
			const normalizedChildren = normalizeSubMenu(
				child.subMenu ?? child.children,
				user,
			);
			return {
				...child,
				label: child.label || child.title,
				subMenu: normalizedChildren,
			};
		})
		.filter((child) => {
			if (user === undefined) return true;
			const hasDirectAccess = hasRoutePermission(user, child);
			const hasChildAccess =
				Array.isArray(child.subMenu) && child.subMenu.length > 0;
			return hasDirectAccess || hasChildAccess;
		})
		.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * Builds the hierarchical Sidebar menu tree from registered routes.
 * Supports both inline `subMenu` / `children` arrays and `parentPath` references.
 * Filters routes based on user permissions when `user` is provided.
 */
export function buildMenuTree(
	routes: readonly AppRoute[],
	user?: AuthUser | null,
): AppRoute[] {
	const menuOnly = routes.filter(isMenuVisibleRoute);

	const itemMap = new Map<string, AppRoute>();
	const rootNodes: AppRoute[] = [];

	for (const item of menuOnly) {
		itemMap.set(item.path, {
			...item,
			label: item.label || item.title,
			subMenu: normalizeSubMenu(item.subMenu ?? item.children, user),
		});
	}

	for (const node of itemMap.values()) {
		if (
			node.parentPath &&
			node.parentPath !== node.path &&
			itemMap.has(node.parentPath)
		) {
			const parent = itemMap.get(node.parentPath)!;
			parent.subMenu = parent.subMenu ?? [];
			if (!parent.subMenu.some((c) => c.path === node.path)) {
				parent.subMenu.push(node);
				parent.subMenu.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
			}
		} else {
			rootNodes.push(node);
		}
	}

	return rootNodes
		.map((root) => {
			if (root.subMenu && root.subMenu.length > 0) {
				const filteredSubMenu = root.subMenu.filter((child) => {
					if (user === undefined) return true;
					const hasDirectAccess = hasRoutePermission(user, child);
					const hasChildAccess =
						Array.isArray(child.subMenu) && child.subMenu.length > 0;
					return hasDirectAccess || hasChildAccess;
				});
				return {
					...root,
					subMenu: filteredSubMenu,
				};
			}
			return root;
		})
		.filter((root) => {
			if (user === undefined) return true;
			const hasDirectAccess = hasRoutePermission(user, root);
			const hasChildAccess =
				Array.isArray(root.subMenu) && root.subMenu.length > 0;
			return hasDirectAccess || hasChildAccess;
		})
		.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
