import type { FilterFieldConfig, FilterSelectOption } from '@core/types/filter';

interface VendorFilterConfigOptions {
	statusOptions?: FilterSelectOption[];
}

export const getVendorFilterConfigs = ({
	statusOptions = [],
}: VendorFilterConfigOptions = {}): FilterFieldConfig[] => [
	{
		name: 'search',
		type: 'search',
		placeholder: 'Search name, code, contact, tax...',
		width: 280,
	},
	{
		name: 'status',
		type: 'select',
		placeholder: 'Status',
		width: 150,
		options: statusOptions.length > 0 ? statusOptions : [
			{ label: 'Active', value: 'active' },
			{ label: 'Inactive', value: 'inactive' },
			{ label: 'Suspended', value: 'suspended' },
		],
	},
];
