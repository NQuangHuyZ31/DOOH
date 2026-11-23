import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Button, Space, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { DynamicFilterBar } from '@core/components/DynamicFilterBar';
import { Table } from '@core/components/Table';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { fetchVenues, fetchScreens } from '@modules/Venue/resources/js/store/venueThunk';
import { getLineItemColumns } from '../configs/lineItemColumns';
import { getLineItemFilterConfigs } from '../configs/deliveryFilterConfigs';
import { setLineItemFilters, setLineItemModalOpen, setSelectedLineItem, setPlaylistModalOpen } from '../store/deliverySlice';
import { fetchLineItems, createLineItem, updateLineItem, deleteLineItem, fetchPlaylistPreview, fetchCampaigns } from '../store/deliveryThunk';
import { LineItemFormModal } from './LineItemFormModal';
import { PlaylistPreviewModal } from './PlaylistPreviewModal';
import type { LineItem, DeliveryQueryParams } from '../types/delivery';

export const LineItemTab: React.FC = () => {
	const dispatch = useAppDispatch();
	const { lineItems, lineItemPagination, lineItemFilters, loading, submitting, selectedLineItem, lineItemModalOpen, campaigns, playlistPreview, playlistModalOpen } = useAppSelector((state) => state.delivery);
	const screens = useAppSelector((state) => state.venue?.screens || []);
	const venues = useAppSelector((state) => state.venue?.venues || []);
	const [previewScreenId, setPreviewScreenId] = useState<number | undefined>();

	const campaignOptions = useMemo(() => campaigns.map((c) => ({ label: c.name, value: c.id })), [campaigns]);
	const filterConfigs = useMemo(() => getLineItemFilterConfigs(campaignOptions), [campaignOptions]);

	const loadData = useCallback(() => {
		dispatch(fetchLineItems({ ...lineItemFilters, page: lineItemPagination.current || 1, per_page: lineItemPagination.pageSize || 15 }));
	}, [dispatch, lineItemFilters, lineItemPagination.current, lineItemPagination.pageSize]);

	useEffect(() => { loadData(); }, [loadData]);
	useEffect(() => {
		if (campaigns.length === 0) dispatch(fetchCampaigns({ per_page: 100 }));
		if (venues.length === 0) dispatch(fetchVenues({ per_page: 100 }));
		if (screens.length === 0) dispatch(fetchScreens({ per_page: 100 }));
	}, [dispatch, campaigns.length, venues.length, screens.length]);

	const handleFilterChange = (filters: Record<string, any>) => {
		dispatch(setLineItemFilters(filters as DeliveryQueryParams));
		dispatch(fetchLineItems({ ...filters, page: 1, per_page: lineItemPagination.pageSize || 15 }));
	};

	const handleSave = async (values: Partial<LineItem> & { screen_ids?: number[]; venue_ids?: number[]; creatives?: Array<{ id: number; weight: number }> }) => {
		try {
			if (selectedLineItem) {
				await dispatch(updateLineItem({ id: selectedLineItem.id, payload: values })).unwrap();
				message.success('Line item updated successfully.');
			} else {
				await dispatch(createLineItem(values)).unwrap();
				message.success('Line item created successfully.');
			}
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save line item.')); }
	};

	const handleDelete = async (id: number) => {
		try { await dispatch(deleteLineItem(id)).unwrap(); message.success('Line item deleted successfully.'); }
		catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to delete line item.')); }
	};

	const handlePreviewPlaylist = async () => {
		if (!previewScreenId) {
			message.warning('Please select a screen first.');
			return;
		}
		try { await dispatch(fetchPlaylistPreview({ screen_id: previewScreenId })).unwrap(); }
		catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to generate preview.')); }
	};

	const columns = useMemo(() => getLineItemColumns({
		onEdit: (item) => { dispatch(setSelectedLineItem(item)); dispatch(setLineItemModalOpen(true)); },
		onDelete: handleDelete,
	}), [dispatch]);

	const screenOptions = useMemo(() => screens.map((s) => ({
		label: `${s.name} (${s.resolution_width}×${s.resolution_height} - ${s.orientation.toUpperCase()})`,
		value: s.id,
	})), [screens]);

	return (
		<Space direction="vertical" size="middle" style={{ width: '100%', padding: '12px 0' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
				<DynamicFilterBar filters={filterConfigs} onChange={handleFilterChange} />
				<Space>
					<Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => { dispatch(setSelectedLineItem(null)); dispatch(setLineItemModalOpen(true)); }}>Create Line Item</Button>
				</Space>
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<Select placeholder="Select screen to preview playlist" style={{ width: 340 }} allowClear value={previewScreenId} onChange={setPreviewScreenId} options={screenOptions} showSearch />
				<Button icon={<EyeOutlined />} onClick={handlePreviewPlaylist}>Preview Ad Loop</Button>
			</div>
			<Table<LineItem>
				columns={columns} dataSource={lineItems} loading={loading} rowKey="id"
				pagination={{
					current: lineItemPagination.current, pageSize: lineItemPagination.pageSize, total: lineItemPagination.total, showSizeChanger: true,
					onChange: (page, pageSize) => dispatch(fetchLineItems({ ...lineItemFilters, page, per_page: pageSize })),
				}}
			/>
			<LineItemFormModal open={lineItemModalOpen} campaigns={campaigns} initialValues={selectedLineItem} loading={submitting} onCancel={() => dispatch(setLineItemModalOpen(false))} onSubmit={handleSave} />
			<PlaylistPreviewModal open={playlistModalOpen} data={playlistPreview} loading={loading} onClose={() => dispatch(setPlaylistModalOpen(false))} />
		</Space>
	);
};

export default LineItemTab;
