import React, { useMemo } from 'react';
import { Table } from '@core/components/Table';
import { getScreenColumns } from '../configs/screenColumns';
import type { ScreenItem } from '../types/venue';

interface ScreenTableProps {
	data: ScreenItem[];
	loading?: boolean;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
		onChange: (page: number, pageSize: number) => void;
	};
	onEdit: (item: ScreenItem) => void;
	onDelete: (id: number) => void;
	onPreview: (item: ScreenItem) => void;
	onShowCredentials: (item: ScreenItem) => void;
}

export const ScreenTable: React.FC<ScreenTableProps> = ({ data, loading, pagination, onEdit, onDelete, onPreview, onShowCredentials }) => {
	const columns = useMemo(() => getScreenColumns({ onEdit, onDelete, onPreview, onShowCredentials }), [onEdit, onDelete, onPreview, onShowCredentials]);

	return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={pagination} scroll={{ x: 950 }} />;
};

export default ScreenTable;
