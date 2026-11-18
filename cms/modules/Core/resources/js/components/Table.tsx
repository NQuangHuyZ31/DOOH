import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';
import { defaultPagination } from '../configs/pagination';

export interface TableProps<T> extends AntTableProps<T> {
	onPageChange?: (page: number, pageSize: number) => void;
}

export function Table<T extends object>({ columns, dataSource, loading, pagination, rowKey = 'id', onPageChange, ...rest }: TableProps<T>) {
	const paginationConfig =
		pagination === false
			? false
			: {
					...defaultPagination,
					...(typeof pagination === 'object' ? pagination : {}),
					onChange: (page: number, pageSize: number) => {
						onPageChange?.(page, pageSize);
					},
				};

	return <AntTable<T> rowKey={rowKey} columns={columns} dataSource={dataSource} loading={loading} pagination={paginationConfig} {...rest} />;
}

export default Table;
