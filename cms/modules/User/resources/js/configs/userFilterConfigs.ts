import type { FilterFieldConfig } from '@core/types/filter';
import type { RoleItem } from '../types/role';

export const getUserFilterConfigs = (roles: RoleItem[] = []): FilterFieldConfig[] => [
	{ name: 'search', type: 'search', placeholder: 'Search by name or email...', width: 260 },
	{
		name: 'role',
		type: 'select',
		placeholder: 'Filter by Role',
		width: 160,
		options: roles.map((r) => ({ label: r.display_name, value: r.name })),
	},
	{
		name: 'permission_type',
		type: 'select',
		placeholder: 'Permission Mode',
		width: 170,
		options: [
			{ label: 'Role-based', value: 'role' },
			{ label: 'Direct Permissions', value: 'direct' },
		],
	},
];
