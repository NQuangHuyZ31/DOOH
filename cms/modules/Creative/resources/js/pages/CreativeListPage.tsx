import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { Table } from '@core/components/Table';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { hasRole, isSuperAdmin } from '@core/utils/permission';
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
	const currentUser = useAppSelector((state) => state.auth.user);
	const metadata = useAppSelector((state) => state.metadata.data);
	const canReview = isSuperAdmin(currentUser) || hasRole(currentUser, ['admin', 'operator', 'ads_ops']);
	const [formModalOpen, setFormModalOpen] = useState(false);
	const [previewModalOpen, setPreviewModalOpen] = useState(false);
	const [selectedCreative, setSelectedCreative] = useState<CreativeItem | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	const loadData = useCallback(() => {
		dispatch(fetchCreatives({ ...filters, page: pagination.current, per_page: pagination.pageSize }));
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

	const handleDelete = useCallback(
		async (id: number) => {
			try {
				await dispatch(deleteCreative(id)).unwrap();
				message.success('Creative deleted successfully.');
				loadData();
			} catch (err: unknown) {
				message.error(extractErrorMessage(err, 'Failed to delete creative.'));
			}
		},
		[dispatch, loadData],
	);

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

	const handleBatchApprove = async () => {
		if (selectedRowKeys.length === 0) return;
		try {
			await creativeApi.batchReview(selectedRowKeys as number[], { status: 'approved' });
			message.success(`Approved ${selectedRowKeys.length} creative(s).`);
			setSelectedRowKeys([]);
			loadData();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to batch approve creatives.'));
		}
	};

	const columns = useMemo(() => getCreativeColumns({
		typeOptions: metadata?.enums?.creative_types || [],
		onPreview: (item) => { setSelectedCreative(item); setPreviewModalOpen(true); },
		onEdit: (item) => { setSelectedCreative(item); setFormModalOpen(true); },
		onDelete: handleDelete,
	}), [metadata, handleDelete]);

	const filterConfigs = useMemo(() => getCreativeFilterConfigs(metadata?.enums?.creative_types || [], metadata?.statuses?.creative || []), [metadata]);

	const rowSelection = canReview ? {
		selectedRowKeys,
		onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
		getCheckboxProps: (r: CreativeItem) => ({ disabled: r.status !== 'pending_review' }),
	} : undefined;

	const paginationConfig = {
		current: pagination.current,
		pageSize: pagination.pageSize,
		total: pagination.total,
		showSizeChanger: true,
		onChange: (page: number, pageSize: number) => dispatch(setCreativePagination({ current: page, pageSize })),
	};

	return (
		<ListLayout
			title="Creative Assets"
			description="Upload, validate, preview, and review multi-format DOOH media creatives."
			filters={filterConfigs}
			onFilterChange={(values) => dispatch(setCreativeFilters(values))}
			extraActions={
				<Space>
					{canReview && selectedRowKeys.length > 0 && (
						<Button type="primary" style={{ background: '#10b981' }} icon={<CheckCircleOutlined />} onClick={handleBatchApprove}>
							{`Approve (${selectedRowKeys.length})`}
						</Button>
					)}
					<Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedCreative(null); setFormModalOpen(true); }}>
						Upload Creatives
					</Button>
				</Space>
			}
		>
			<Table rowKey="id" columns={columns} dataSource={creatives} loading={loading} rowSelection={rowSelection} pagination={paginationConfig} />
			<CreativeFormModal open={formModalOpen} initialValues={selectedCreative} submitting={submitting} onCancel={() => setFormModalOpen(false)} onSave={handleSave} />
			<CreativePreviewModal open={previewModalOpen} creative={selectedCreative} submitting={submitting} onCancel={() => setPreviewModalOpen(false)} onReview={handleReview} />
		</ListLayout>
	);
};

export default CreativeListPage;
