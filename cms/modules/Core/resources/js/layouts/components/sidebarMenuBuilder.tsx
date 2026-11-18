import React, { isValidElement } from 'react';
import type { MenuProps } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';

export function resolveMenuIcon(item: AppRoute): React.ReactNode {
	if (item.icon) {
		if (isValidElement(item.icon)) {
			return item.icon;
		}
		const IconComponent = item.icon as React.ComponentType;
		return <IconComponent />;
	}
	return <AppstoreOutlined />;
}

export function buildSidebarMenuItems(routes: AppRoute[], onTitleNavigate?: (path: string) => void, currentPath?: string): MenuProps['items'] {
	return routes.map((route) => {
		const hasSubMenu = Boolean(route.subMenu && route.subMenu.length > 0);
		const labelText = route.label || route.title || route.path;

		if (hasSubMenu) {
			const isNavigable = Boolean(route.element || route.component);
			const isSelected = Boolean(currentPath && currentPath === route.path);

			return {
				key: route.path,
				icon: resolveMenuIcon(route),
				className: isSelected ? 'ant-menu-submenu-title-selected' : undefined,
				label: labelText,
				onTitleClick:
					isNavigable && onTitleNavigate
						? ({ key, domEvent }: { key: string; domEvent: React.MouseEvent | React.KeyboardEvent }) => {
								domEvent.preventDefault();
								if (document.activeElement instanceof HTMLElement) {
									document.activeElement.blur();
								}
								onTitleNavigate(key);
							}
						: undefined,
				children: buildSidebarMenuItems(route.subMenu!, onTitleNavigate, currentPath),
			};
		}

		return {
			key: route.path,
			icon: resolveMenuIcon(route),
			label: labelText,
		};
	});
}

export function resolveActiveMenuKeys(routes: AppRoute[], pathname: string): { selectedKeys: string[]; defaultOpenKeys: string[] } {
	const selectedKeys: string[] = [];
	const defaultOpenKeys: string[] = [];

	const traverse = (items: AppRoute[], ancestors: string[]): boolean => {
		let matchedInBranch = false;

		for (const route of items) {
			const children = route.subMenu ?? [];
			const childMatched = children.length > 0 && traverse(children, [...ancestors, route.path]);

			if (childMatched) {
				matchedInBranch = true;
				if (!defaultOpenKeys.includes(route.path)) {
					defaultOpenKeys.push(route.path);
				}
				continue;
			}

			const isExactMatch = pathname === route.path;
			const isPrefixMatch = children.length === 0 && pathname.startsWith(`${route.path}/`);

			if (isExactMatch || isPrefixMatch) {
				selectedKeys.push(route.path);
				matchedInBranch = true;

				for (const ancestor of ancestors) {
					if (!defaultOpenKeys.includes(ancestor)) {
						defaultOpenKeys.push(ancestor);
					}
				}
				if (children.length > 0 && !defaultOpenKeys.includes(route.path)) {
					defaultOpenKeys.push(route.path);
				}
			}
		}

		return matchedInBranch;
	};

	traverse(routes, []);

	return { selectedKeys, defaultOpenKeys };
}
