import type { FilterFieldConfig, FilterSelectOption } from '@core/types/filter';

export const CAMPAIGN_STATUS_OPTIONS: FilterSelectOption[] = [
	{ label: 'Active', value: 'active' },
	{ label: 'Paused', value: 'paused' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Completed', value: 'completed' },
	{ label: 'Archived', value: 'archived' },
];

export const LINE_ITEM_STATUS_OPTIONS: FilterSelectOption[] = [
	{ label: 'Active', value: 'active' },
	{ label: 'Paused', value: 'paused' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Completed', value: 'completed' },
];

export const PACING_MODE_OPTIONS: FilterSelectOption[] = [
	{ label: 'Evenly (Spread Hourly)', value: 'evenly' },
	{ label: 'ASAP (Immediate Delivery)', value: 'asap' },
];

export const getCampaignFilterConfigs = (): FilterFieldConfig[] => [
	{
		name: 'search',
		type: 'search',
		placeholder: 'Search campaign name, code...',
		width: 260,
	},
	{
		name: 'status',
		type: 'select',
		placeholder: 'Status',
		width: 140,
		options: CAMPAIGN_STATUS_OPTIONS,
	},
];

export const getLineItemFilterConfigs = (campaignOptions: FilterSelectOption[] = []): FilterFieldConfig[] => [
	{
		name: 'search',
		type: 'search',
		placeholder: 'Search line item name, code...',
		width: 240,
	},
	{
		name: 'campaign_id',
		type: 'select',
		placeholder: 'Campaign',
		width: 180,
		options: campaignOptions,
	},
	{
		name: 'pacing_mode',
		type: 'select',
		placeholder: 'Pacing Mode',
		width: 150,
		options: PACING_MODE_OPTIONS,
	},
	{
		name: 'status',
		type: 'select',
		placeholder: 'Status',
		width: 130,
		options: LINE_ITEM_STATUS_OPTIONS,
	},
];
