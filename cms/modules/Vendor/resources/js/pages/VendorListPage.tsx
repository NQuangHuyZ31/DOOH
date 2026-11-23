import React, { useEffect, useCallback, useMemo } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { Table } from '@core/components/Table';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { getVendorColumns } from '../configs/vendorColumns';
import { getVendorFilterConfigs } from '../configs/vendorFilterConfigs';
import { setFilters, setFormModalOpen, setSelectedVendor, setKeyModalOpen } from '../store/vendorSlice';
import { fetchVendors, createVendor, updateVendor, deleteVendor, regenerateApiKey } from '../store/vendorThunk';
import { VendorFormModal } from '../components/VendorFormModal';
import { VendorApiKeyModal } from '../components/VendorApiKeyModal';
import type { VendorItem, VendorQueryParams } from '../types/vendor';

export const VendorListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { vendors, pagination, filters, loading, submitting, selectedVendor, formModalOpen, keyModalOpen, generatedApiKey } = useAppSelector((state) => state.vendor);

	const loadData = useCallback(() => {
		dispatch(fetchVendors({ ...filters, per_page: pagination.pageSize || 15 }));
	}, [dispatch, filters, pagination.pageSize]);

	useEffect(() => { loadData(); }, [loadData]);

	const handleSave = async (values: Partial<VendorItem>) => {
		try {
			if (selectedVendor) {
				await dispatch(updateVendor({ id: selectedVendor.id, payload: values })).unwrap();
				message.success('Vendor updated successfully.');
			} else {
				await dispatch(createVendor(values)).unwrap();
				message.success('Vendor registered successfully. Store the generated API key!');
			}
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save vendor.')); }
	};

	const handleDelete = async (id: number) => {
		try { await dispatch(deleteVendor(id)).unwrap(); message.success('Vendor deleted successfully.'); }
		catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to delete vendor.')); }
	};

	const handleRegenerateKey = async (item: VendorItem) => {
		try { await dispatch(regenerateApiKey(item.id)).unwrap(); message.success('API key regenerated successfully.'); }
		catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to regenerate API key.')); }
	};

	const columns = useMemo(() => getVendorColumns({
		onEdit: (item) => { dispatch(setSelectedVendor(item)); dispatch(setFormModalOpen(true)); },
		onDelete: handleDelete, onRegenerateKey: handleRegenerateKey,
	}), [dispatch]);

	return (
		<ListLayout
			title="Media Owners & Vendors"
			description="Manage media asset owners, revenue sharing agreements, and partner API ingestion keys."
			extraActions={
				<Space>
					<Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => { dispatch(setSelectedVendor(null)); dispatch(setFormModalOpen(true)); }}>Add Vendor</Button>
				</Space>
			}
			filters={getVendorFilterConfigs()}
			onFilterChange={(newFilters) => dispatch(setFilters(newFilters as VendorQueryParams))}
		>
			<Table<VendorItem>
				columns={columns} dataSource={vendors} loading={loading} rowKey="id"
				pagination={{
					current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true,
					onChange: (page, pageSize) => dispatch(fetchVendors({ ...filters, page, per_page: pageSize })),
				}}
			/>
			<VendorFormModal open={formModalOpen} initialValues={selectedVendor} loading={submitting} onCancel={() => dispatch(setFormModalOpen(false))} onSubmit={handleSave} />
			<VendorApiKeyModal open={keyModalOpen} apiKey={generatedApiKey} onClose={() => dispatch(setKeyModalOpen(false))} />
		</ListLayout>
	);
};

export default VendorListPage;
