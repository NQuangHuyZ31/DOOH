import type { ReactNode } from 'react';

export type FilterFieldType = 'search' | 'select' | 'date-range' | 'custom';

export interface FilterSelectOption {
	label: string;
	value: string | number;
}

export interface FilterFieldConfig {
	name: string;
	type: FilterFieldType;
	label?: string;
	placeholder?: string;
	width?: number | string;
	defaultValue?: any;
	options?: FilterSelectOption[];
	render?: (value: any, onChange: (val: any) => void) => ReactNode;
}
