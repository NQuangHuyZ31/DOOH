import { useState, useCallback } from 'react';
import { defaultPagination, PaginationConfig } from '../configs/pagination';
import { useAppSelector } from '../store/hooks';

export function usePagination(initialPage = 1, initialPageSize?: number) {
	const metaDefaultPerPage = useAppSelector((state) => state.metadata.data?.pagination?.default_per_page);
	const resolvedPageSize = initialPageSize ?? metaDefaultPerPage ?? defaultPagination.pageSize;

	const [pagination, setPagination] = useState<PaginationConfig>({
		...defaultPagination,
		current: initialPage,
		pageSize: resolvedPageSize,
	});

	const handlePageChange = useCallback((page: number, pageSize: number) => {
		setPagination((prev) => ({
			...prev,
			current: page,
			pageSize,
		}));
	}, []);

	const setTotal = useCallback((total: number) => {
		setPagination((prev) => ({
			...prev,
			total,
		}));
	}, []);

	const resetPagination = useCallback(() => {
		setPagination((prev) => ({
			...prev,
			current: 1,
		}));
	}, []);

	return {
		pagination,
		handlePageChange,
		setTotal,
		resetPagination,
	};
}

export default usePagination;
