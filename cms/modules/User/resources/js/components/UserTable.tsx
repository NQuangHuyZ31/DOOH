import React, { useMemo } from 'react';
import type { TablePaginationConfig } from 'antd';
import { Table } from '@core/components/Table';
import { getUserColumns } from '../configs/userColumns';
import type { UserItem } from '../types/user';

export interface UserTableProps {
	users: UserItem[];
	loading: boolean;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	onTableChange: (pagination: TablePaginationConfig) => void;
	onEdit: (user: UserItem) => void;
	onDelete: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, pagination, onTableChange, onEdit, onDelete }) => {
	const columns = useMemo(() => getUserColumns(onEdit, onDelete), [onEdit, onDelete]);

	return (
		<Table<UserItem>
			rowKey="id"
			columns={columns}
			dataSource={users}
			loading={loading}
			pagination={{
				current: pagination.current,
				pageSize: pagination.pageSize,
				total: pagination.total,
				showSizeChanger: true,
				showTotal: (total) => `Total ${total} users`,
			}}
			onChange={onTableChange}
		/>
	);
};

export default UserTable;
