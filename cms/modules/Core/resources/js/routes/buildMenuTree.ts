import { isMenuVisibleRoute, type AppRoute } from './types';

function normalizeSubMenu(children?: AppRoute[]): AppRoute[] {
	if (!children || children.length === 0) return [];
	return children
		.filter(isMenuVisibleRoute)
		.map((child) => ({
			...child,
			label: child.label || child.title,
			subMenu: normalizeSubMenu(child.subMenu ?? child.children),
		}))
		.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * Builds the hierarchical Sidebar menu tree from registered routes.
 * Supports both inline `subMenu` / `children` arrays and `parentPath` references.
 */
export function buildMenuTree(routes: readonly AppRoute[]): AppRoute[] {
	const menuOnly = routes.filter(isMenuVisibleRoute);

	const itemMap = new Map<string, AppRoute>();
	const rootNodes: AppRoute[] = [];

	for (const item of menuOnly) {
		itemMap.set(item.path, {
			...item,
			label: item.label || item.title,
			subMenu: normalizeSubMenu(item.subMenu ?? item.children),
		});
	}

	for (const node of itemMap.values()) {
		if (node.parentPath && node.parentPath !== node.path && itemMap.has(node.parentPath)) {
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

	return rootNodes.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
