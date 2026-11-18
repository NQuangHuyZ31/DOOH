import React, { isValidElement } from 'react';
import type { MenuProps } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import { Link } from 'react-router-dom';

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

export function buildSidebarMenuItems(routes: AppRoute[]): MenuProps['items'] {
	return routes.map((route) => {
		const hasSubMenu = Boolean(route.subMenu && route.subMenu.length > 0);
		const labelText = route.label || route.title || route.path;

		if (hasSubMenu) {
			return {
				key: route.path,
				icon: resolveMenuIcon(route),
				label: <Link to={route.path}>{labelText}</Link>,
				children: buildSidebarMenuItems(route.subMenu!),
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

	for (const route of routes) {
		const children = route.subMenu ?? [];
		for (const child of children) {
			if (pathname === child.path || pathname.startsWith(`${child.path}/`)) {
				selectedKeys.push(child.path);
				defaultOpenKeys.push(route.path);
			}
		}

		if (selectedKeys.length === 0 && (pathname === route.path || pathname.startsWith(`${route.path}/`))) {
			selectedKeys.push(route.path);
		}
	}

	return { selectedKeys, defaultOpenKeys };
}
