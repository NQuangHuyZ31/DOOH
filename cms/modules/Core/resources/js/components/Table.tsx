import React, { useMemo } from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';
import { defaultPagination } from '../configs/pagination';
import { useAppSelector } from '../store/hooks';

export interface TableProps<T> extends AntTableProps<T> {
	onPageChange?: (page: number, pageSize: number) => void;
}

export function Table<T extends object>({ columns, dataSource, loading, pagination, rowKey = 'id', onPageChange, ...rest }: TableProps<T>) {
	const metaPagination = useAppSelector((state) => state.metadata.data?.pagination);

	const basePagination = useMemo(
		() => ({
			...defaultPagination,
			pageSize: metaPagination?.default_per_page ?? defaultPagination.pageSize,
			pageSizeOptions: metaPagination?.per_page_options ? metaPagination.per_page_options.map(String) : defaultPagination.pageSizeOptions,
		}),
		[metaPagination],
	);

	const paginationConfig =
		pagination === false
			? false
			: {
					...basePagination,
					...(typeof pagination === 'object' ? pagination : {}),
					onChange: (page: number, pageSize: number) => {
						onPageChange?.(page, pageSize);
					},
				};

	return <AntTable<T> rowKey={rowKey} columns={columns} dataSource={dataSource} loading={loading} pagination={paginationConfig} {...rest} />;
}

export default Table;
