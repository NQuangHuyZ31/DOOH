import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Modal, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { Table } from '@core/components/Table';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { creativeApi } from '../Action/creativeApi';
import { fetchCreatives, createCreative, updateCreative, deleteCreative, reviewCreative } from '../store/creativeThunk';
import { setCreativeFilters, setCreativePagination } from '../store/creativeSlice';
import { getCreativeColumns } from '../configs/creativeColumns';
import { getCreativeFilterConfigs } from '../configs/creativeFilterConfigs';
import { CreativeFormModal } from '../components/CreativeFormModal';
import { CreativePreviewModal } from '../components/CreativePreviewModal';
import type { CreativeItem, CreativeFormData, CreativeReviewPayload } from '../types/creative';

export const CreativeListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { creatives, pagination, filters, loading, submitting } = useAppSelector((state) => state.creative);
	const metadata = useAppSelector((state) => state.metadata.data);
	const [formModalOpen, setFormModalOpen] = useState(false);
	const [previewModalOpen, setPreviewModalOpen] = useState(false);
	const [selectedCreative, setSelectedCreative] = useState<CreativeItem | null>(null);

	const loadData = useCallback(() => {
		dispatch(
			fetchCreatives({
				...filters,
				page: pagination.current,
				per_page: pagination.pageSize,
			}),
		);
	}, [dispatch, filters, pagination.current, pagination.pageSize]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleSave = async (items: CreativeFormData[]) => {
		try {
			if (selectedCreative) {
				await dispatch(updateCreative({ id: selectedCreative.id, payload: items[0] })).unwrap();
				message.success('Creative asset updated successfully.');
			} else if (items.length === 1) {
				await dispatch(createCreative(items[0])).unwrap();
				message.success('Creative registered successfully.');
			} else {
				await creativeApi.createBatch(items);
				message.success(`${items.length} creatives uploaded successfully.`);
			}
			setFormModalOpen(false);
			loadData();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to save creatives.'));
		}
	};

	const handleDelete = (creative: CreativeItem) => {
		Modal.confirm({
			title: `Delete creative asset [${creative.code}]?`,
			icon: <ExclamationCircleOutlined />,
			content: 'This will remove the creative from the media library and pause any linked line items.',
			okText: 'Yes, Delete',
			okType: 'danger',
			onOk: async () => {
				try {
					await dispatch(deleteCreative(creative.id)).unwrap();
					message.success('Creative deleted successfully.');
					loadData();
				} catch (err: unknown) {
					message.error(extractErrorMessage(err, 'Failed to delete creative.'));
				}
			},
		});
	};

	const handleReview = async (id: number, payload: CreativeReviewPayload) => {
		try {
			await dispatch(reviewCreative({ id, payload })).unwrap();
			message.success(`Creative status updated to ${payload.status}.`);
			setPreviewModalOpen(false);
			loadData();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to update creative status.'));
		}
	};

	const columns = useMemo(
		() =>
			getCreativeColumns({
				onPreview: (item) => {
					setSelectedCreative(item);
					setPreviewModalOpen(true);
				},
				onEdit: (item) => {
					setSelectedCreative(item);
					setFormModalOpen(true);
				},
				onDelete: handleDelete,
			}),
		[loadData],
	);

	const filterConfigs = useMemo(() => getCreativeFilterConfigs(metadata?.enums?.creative_types || [], metadata?.statuses?.creative || []), [metadata]);

	return (
		<ListLayout
			title="Creative Assets"
			description="Upload, validate, preview, and review multi-format DOOH media creatives."
			filters={filterConfigs}
			onFilterChange={(values) => dispatch(setCreativeFilters(values))}
			extraActions={
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						setSelectedCreative(null);
						setFormModalOpen(true);
					}}
				>
					Upload Creatives
				</Button>
			}
		>
			<Table
				rowKey="id"
				columns={columns}
				dataSource={creatives}
				loading={loading}
				pagination={{
					current: pagination.current,
					pageSize: pagination.pageSize,
					total: pagination.total,
					showSizeChanger: true,
					onChange: (page, pageSize) => dispatch(setCreativePagination({ current: page, pageSize })),
				}}
			/>
			<CreativeFormModal open={formModalOpen} initialValues={selectedCreative} submitting={submitting} onCancel={() => setFormModalOpen(false)} onSave={handleSave} />
			<CreativePreviewModal open={previewModalOpen} creative={selectedCreative} submitting={submitting} onCancel={() => setPreviewModalOpen(false)} onReview={handleReview} />
		</ListLayout>
	);
};

export default CreativeListPage;
