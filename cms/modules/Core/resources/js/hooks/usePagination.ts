import { useState, useCallback } from 'react';
import { defaultPagination, PaginationConfig } from '../configs/pagination';

export function usePagination(initialPage = 1, initialPageSize = 10) {
    const [pagination, setPagination] = useState<PaginationConfig>({
        ...defaultPagination,
        current: initialPage,
        pageSize: initialPageSize,
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
