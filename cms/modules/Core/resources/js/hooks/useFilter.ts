import { useState, useCallback } from 'react';

export function useFilter<T extends object>(initialFilters: T) {
	const [filters, setFilters] = useState<T>(initialFilters);

	const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	const updateFilters = useCallback((newFilters: Partial<T>) => {
		setFilters((prev) => ({
			...prev,
			...newFilters,
		}));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters(initialFilters);
	}, [initialFilters]);

	return {
		filters,
		updateFilter,
		updateFilters,
		resetFilters,
	};
}

export default useFilter;
