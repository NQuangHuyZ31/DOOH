import type { FilterFieldConfig, FilterSelectOption } from '@core/types/filter';

const defaultConnectivityOptions: FilterSelectOption[] = [
	{ label: 'Online', value: 'online' },
	{ label: 'Offline', value: 'offline' },
	{ label: 'Degraded', value: 'degraded' },
];

interface ScreenFilterConfigOptions {
	venueOptions?: FilterSelectOption[];
	screenTypeOptions?: FilterSelectOption[];
	connectivityOptions?: FilterSelectOption[];
	statusOptions?: FilterSelectOption[];
}

export const getScreenFilterConfigs = ({
	venueOptions = [],
	screenTypeOptions = [],
	connectivityOptions = defaultConnectivityOptions,
	statusOptions = [],
}: ScreenFilterConfigOptions = {}): FilterFieldConfig[] => [
	{
		name: 'search',
		type: 'search',
		placeholder: 'Search screen name, code, device UID...',
		width: 250,
	},
	{
		name: 'venue_id',
		type: 'select',
		placeholder: 'Filter by Venue',
		width: 200,
		options: venueOptions,
	},
	{
		name: 'screen_type',
		type: 'select',
		placeholder: 'Screen Type',
		width: 150,
		options: screenTypeOptions,
	},
	{
		name: 'connectivity_status',
		type: 'select',
		placeholder: 'Connectivity',
		width: 140,
		options: connectivityOptions,
	},
	{
		name: 'status',
		type: 'select',
		placeholder: 'Status',
		width: 130,
		options: statusOptions,
	},
];
