import React, { useMemo } from 'react';
import type { TablePaginationConfig } from 'antd';
import { Table } from '@core/components/Table';
import { useAppSelector } from '@core/store/hooks';
import type { MetadataOption } from '@core/types/metadata';
import { getPermissionColumns } from '../configs/permissionColumns';
import type { PermissionItem } from '../types/permission';

export interface PermissionTableProps {
	permissions: PermissionItem[];
	loading: boolean;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	onTableChange: (pagination: TablePaginationConfig) => void;
	onEdit: (permission: PermissionItem) => void;
	onDelete: (id: number) => void;
	moduleOptions?: MetadataOption[];
}

export const PermissionTable: React.FC<PermissionTableProps> = ({ permissions, loading, pagination, onTableChange, onEdit, onDelete, moduleOptions: customModuleOptions }) => {
	const metadataModules = useAppSelector((state) => state.metadata.data?.enums?.modules);
	const moduleOptions = customModuleOptions ?? metadataModules;

	const columns = useMemo(() => getPermissionColumns(onEdit, onDelete, moduleOptions), [onEdit, onDelete, moduleOptions]);

	return (
		<Table<PermissionItem>
			rowKey="id"
			columns={columns}
			dataSource={permissions}
			loading={loading}
			pagination={{
				current: pagination.current,
				pageSize: pagination.pageSize,
				total: pagination.total,
				showSizeChanger: true,
				showTotal: (total) => `Total ${total} permissions`,
			}}
			onChange={onTableChange}
		/>
	);
};

export default PermissionTable;
