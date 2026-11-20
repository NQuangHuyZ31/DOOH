import type { FilterFieldConfig } from '@core/types/filter';
import type { MetadataOption } from '@core/types/metadata';

export const getCreativeFilterConfigs = (
	typeOptions: MetadataOption[] = [],
	statusOptions: MetadataOption[] = [],
): FilterFieldConfig[] => [
	{
		name: 'search',
		type: 'search',
		placeholder: 'Search creative by name or code...',
		width: 260,
	},
	{
		name: 'type',
		type: 'select',
		placeholder: 'All Media Types',
		width: 180,
		options: [{ label: 'All Media Types', value: '' }, ...typeOptions],
	},
	{
		name: 'status',
		type: 'select',
		placeholder: 'All Statuses',
		width: 170,
		options: [{ label: 'All Statuses', value: '' }, ...statusOptions],
	},
];

export default getCreativeFilterConfigs;
