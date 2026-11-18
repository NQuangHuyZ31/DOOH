import React, { useMemo } from 'react';
import type { TablePaginationConfig } from 'antd';
import { Table } from '@core/components/Table';
import { getRoleColumns } from '../configs/roleColumns';
import type { RoleItem } from '../types/role';

export interface RoleTableProps {
	roles: RoleItem[];
	loading: boolean;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	onTableChange: (pagination: TablePaginationConfig) => void;
	onEdit: (role: RoleItem) => void;
	onDelete: (id: number) => void;
}

export const RoleTable: React.FC<RoleTableProps> = ({ roles, loading, pagination, onTableChange, onEdit, onDelete }) => {
	const columns = useMemo(() => getRoleColumns(onEdit, onDelete), [onEdit, onDelete]);

	return (
		<Table<RoleItem>
			rowKey="id"
			columns={columns}
			dataSource={roles}
			loading={loading}
			pagination={{
				current: pagination.current,
				pageSize: pagination.pageSize,
				total: pagination.total,
				showSizeChanger: true,
				showTotal: (total) => `Total ${total} roles`,
			}}
			onChange={onTableChange}
		/>
	);
};

export default RoleTable;
