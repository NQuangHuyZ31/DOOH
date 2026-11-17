import React, { useState, useEffect, useCallback } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { VenueTable } from '../components/VenueTable';
import { VenueFormModal } from '../components/VenueFormModal';
import { venueApi, type VenueItem } from '../Action/venueApi';

export const VenueListPage: React.FC = () => {
	const [data, setData] = useState<VenueItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<VenueItem | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

	const fetchData = useCallback(async (page = 1, pageSize = 15) => {
		setLoading(true);
		try {
			const res = await venueApi.getVenues({ page, per_page: pageSize });
			setData(res.data?.data || []);
			if (res.data?.pagination) {
				setPagination({
					current: res.data.pagination.current_page,
					pageSize: res.data.pagination.per_page,
					total: res.data.pagination.total,
				});
			}
		} catch {
			// Fallback empty list on initial setup without db
			setData([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleCreateOrUpdate = async (values: Partial<VenueItem>) => {
		setSubmitting(true);
		try {
			if (editingItem) {
				await venueApi.updateVenue(editingItem.id, values);
				message.success('Venue updated successfully');
			} else {
				await venueApi.createVenue(values);
				message.success('Venue created successfully');
			}
			setModalOpen(false);
			setEditingItem(null);
			fetchData(pagination.current, pagination.pageSize);
		} catch (err: any) {
			message.error(err.response?.data?.message || 'Operation failed');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await venueApi.deleteVenue(id);
			message.success('Venue deleted successfully');
			fetchData(pagination.current, pagination.pageSize);
		} catch (err: any) {
			message.error(err.response?.data?.message || 'Delete failed');
		}
	};

	const handlePreview = (item: VenueItem) => {
		message.info(`Launching Simulator for screen: ${item.name} (${item.code})`);
	};

	return (
		<ListLayout
			title="Screen Venues"
			description="Manage DOOH physical screens, resolutions, orientations and simulator endpoints"
			extraActions={
				<Space>
					<Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditingItem(null);
							setModalOpen(true);
						}}
					>
						Add Screen
					</Button>
				</Space>
			}
		>
			<VenueTable
				data={data}
				loading={loading}
				pagination={{
					...pagination,
					onChange: (page, pageSize) => fetchData(page, pageSize),
				}}
				onEdit={(item) => {
					setEditingItem(item);
					setModalOpen(true);
				}}
				onDelete={handleDelete}
				onPreview={handlePreview}
			/>

			<VenueFormModal
				open={modalOpen}
				initialValues={editingItem}
				loading={submitting}
				onCancel={() => {
					setModalOpen(false);
					setEditingItem(null);
				}}
				onSubmit={handleCreateOrUpdate}
			/>
		</ListLayout>
	);
};

export default VenueListPage;
