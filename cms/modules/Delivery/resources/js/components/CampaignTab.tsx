import React, { useEffect, useCallback, useMemo } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DynamicFilterBar } from '@core/components/DynamicFilterBar';
import { Table } from '@core/components/Table';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { getCampaignColumns } from '../configs/campaignColumns';
import { getCampaignFilterConfigs } from '../configs/deliveryFilterConfigs';
import { setCampaignFilters, setCampaignModalOpen, setSelectedCampaign } from '../store/deliverySlice';
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../store/deliveryThunk';
import { CampaignFormModal } from './CampaignFormModal';
import type { CampaignItem, DeliveryQueryParams } from '../types/delivery';

export const CampaignTab: React.FC = () => {
	const dispatch = useAppDispatch();
	const { campaigns, campaignPagination, campaignFilters, loading, submitting, selectedCampaign, campaignModalOpen } = useAppSelector((state) => state.delivery);
	const filterConfigs = useMemo(() => getCampaignFilterConfigs(), []);

	const loadData = useCallback(() => {
		dispatch(fetchCampaigns({ ...campaignFilters, page: campaignPagination.current || 1, per_page: campaignPagination.pageSize || 15 }));
	}, [dispatch, campaignFilters, campaignPagination.current, campaignPagination.pageSize]);

	useEffect(() => { loadData(); }, [loadData]);

	const handleFilterChange = (filters: Record<string, any>) => {
		dispatch(setCampaignFilters(filters as DeliveryQueryParams));
		dispatch(fetchCampaigns({ ...filters, page: 1, per_page: campaignPagination.pageSize || 15 }));
	};

	const handleSave = async (values: Partial<CampaignItem>) => {
		try {
			if (selectedCampaign) {
				await dispatch(updateCampaign({ id: selectedCampaign.id, payload: values })).unwrap();
				message.success('Campaign updated successfully.');
			} else {
				await dispatch(createCampaign(values)).unwrap();
				message.success('Campaign created successfully.');
			}
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save campaign.')); }
	};

	const handleDelete = async (id: number) => {
		try { await dispatch(deleteCampaign(id)).unwrap(); message.success('Campaign deleted successfully.'); }
		catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to delete campaign.')); }
	};

	const columns = useMemo(() => getCampaignColumns({
		onEdit: (item) => { dispatch(setSelectedCampaign(item)); dispatch(setCampaignModalOpen(true)); },
		onDelete: handleDelete,
	}), [dispatch]);

	return (
		<Space direction="vertical" size="middle" style={{ width: '100%', padding: '12px 0' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
				<DynamicFilterBar filters={filterConfigs} onChange={handleFilterChange} />
				<Space>
					<Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => { dispatch(setSelectedCampaign(null)); dispatch(setCampaignModalOpen(true)); }}>Create Campaign</Button>
				</Space>
			</div>
			<Table<CampaignItem>
				columns={columns} dataSource={campaigns} loading={loading} rowKey="id"
				pagination={{
					current: campaignPagination.current, pageSize: campaignPagination.pageSize, total: campaignPagination.total, showSizeChanger: true,
					onChange: (page, pageSize) => dispatch(fetchCampaigns({ ...campaignFilters, page, per_page: pageSize })),
				}}
			/>
			<CampaignFormModal open={campaignModalOpen} initialValues={selectedCampaign} loading={submitting} onCancel={() => dispatch(setCampaignModalOpen(false))} onSubmit={handleSave} />
		</Space>
	);
};

export default CampaignTab;
