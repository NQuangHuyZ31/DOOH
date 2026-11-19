import type { FilterFieldConfig, FilterSelectOption } from '@core/types/filter';

interface VenueFilterConfigOptions {
	venueTypeOptions?: FilterSelectOption[];
	statusOptions?: FilterSelectOption[];
	mediaOwnerOptions?: FilterSelectOption[];
	isAdmin?: boolean;
}

export const getVenueFilterConfigs = ({
	venueTypeOptions = [],
	statusOptions = [],
	mediaOwnerOptions = [],
	isAdmin = false,
}: VenueFilterConfigOptions = {}): FilterFieldConfig[] => {
	const filters: FilterFieldConfig[] = [
		{
			name: 'search',
			type: 'search',
			placeholder: 'Search venue name, code, city...',
			width: 240,
		},
		{
			name: 'venue_type',
			type: 'select',
			placeholder: 'Venue Type',
			width: 170,
			options: venueTypeOptions,
		},
		{
			name: 'status',
			type: 'select',
			placeholder: 'Status',
			width: 140,
			options: statusOptions,
		},
	];

	if (isAdmin && mediaOwnerOptions.length > 0) {
		filters.push({
			name: 'media_owner_id',
			type: 'select',
			placeholder: 'Media Owner',
			width: 200,
			options: mediaOwnerOptions,
		});
	}

	return filters;
};
