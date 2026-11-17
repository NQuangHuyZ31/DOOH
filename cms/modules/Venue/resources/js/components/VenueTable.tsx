import React from 'react';
import { Table } from '@core';
import { getVenueColumns } from '../configs/venueColumns';
import type { VenueItem } from '../Action/venueApi';

interface VenueTableProps {
  data: VenueItem[];
  loading: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit: (item: VenueItem) => void;
  onDelete: (id: number) => void;
  onPreview: (item: VenueItem) => void;
}

export const VenueTable: React.FC<VenueTableProps> = ({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPreview,
}) => {
  const columns = getVenueColumns({ onEdit, onDelete, onPreview });

  return (
    <Table<VenueItem>
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={pagination}
    />
  );
};
