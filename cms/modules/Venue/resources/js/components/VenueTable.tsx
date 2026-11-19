import React, { useMemo } from 'react';
import { Table } from '@core/components/Table';
import { getVenueColumns } from '../configs/venueColumns';
import type { VenueItem } from '../types/venue';

interface VenueTableProps {
	data: VenueItem[];
	loading?: boolean;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
		onChange: (page: number, pageSize: number) => void;
	};
	onEdit: (item: VenueItem) => void;
	onDelete: (id: number) => void;
}

export const VenueTable: React.FC<VenueTableProps> = ({ data, loading, pagination, onEdit, onDelete }) => {
	const columns = useMemo(() => getVenueColumns({ onEdit, onDelete }), [onEdit, onDelete]);

	return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={pagination} scroll={{ x: 800 }} />;
};

export default VenueTable;
