import React, { useCallback, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { defaultPagination } from '@core/configs/pagination';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import type { FilterFieldConfig } from '@core/types/filter';
import { extractErrorMessage } from '@core/utils/error';
import { PermissionFormModal } from '../components/PermissionFormModal';
import { PermissionTable } from '../components/PermissionTable';
import { closePermissionModal, openCreatePermissionModal, openEditPermissionModal, setPermissionFilters, setPermissionPagination } from '../store/permissionSlice';
import { createPermission, deletePermission, fetchPermissionsPaginated, updatePermission } from '../store/permissionThunk';
import type { PermissionFilterParams, PermissionFormData } from '../types/permission';

export const PermissionListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const metadata = useAppSelector((state) => state.metadata.data);
	const { permissions, loading, submitting, filters, pagination, modalOpen, editingPermission } = useAppSelector((state) => state.permission);

	const moduleOptions = useMemo(() => {
		const raw = metadata?.enums?.modules && metadata.enums.modules.length > 0 ? metadata.enums.modules : (metadata?.app?.modules || []).map((m) => ({ label: m.toUpperCase(), value: m.toLowerCase() }));
		return [{ label: 'All Modules', value: '' }, ...raw];
	}, [metadata]);

	const loadPermissions = useCallback(() => {
		dispatch(fetchPermissionsPaginated({ ...filters, page: pagination.current, per_page: pagination.pageSize }));
	}, [dispatch, filters, pagination.current, pagination.pageSize]);

	useEffect(() => {
		loadPermissions();
	}, [loadPermissions]);

	const handleCreateOrUpdate = async (values: PermissionFormData) => {
		try {
			if (editingPermission) {
				await dispatch(updatePermission({ id: editingPermission.id, payload: values })).unwrap();
				message.success('Permission updated successfully');
			} else {
				await dispatch(createPermission(values)).unwrap();
				message.success('Permission created successfully');
			}
			loadPermissions();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Operation failed'));
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await dispatch(deletePermission(id)).unwrap();
			message.success('Permission deleted successfully');
			loadPermissions();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Delete failed'));
		}
	};

	const filterConfigs: FilterFieldConfig[] = useMemo(
		() => [
			{ name: 'search', type: 'search', placeholder: 'Search by name or slug...', width: 280 },
			{ name: 'module', type: 'select', placeholder: 'Filter by Module', width: 170, options: moduleOptions },
		],
		[moduleOptions],
	);

	return (
		<ListLayout
			title="Permission Management"
			description="Define granular capabilities, review module actions, and control role-based access points"
			extraActions={
				<Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openCreatePermissionModal())}>
					Add Permission
				</Button>
			}
			filters={filterConfigs}
			onFilterChange={(f) => dispatch(setPermissionFilters(f as PermissionFilterParams))}
		>
			<PermissionTable
				permissions={permissions}
				loading={loading}
				pagination={pagination}
				onTableChange={(p) => dispatch(setPermissionPagination({ current: p.current || 1, pageSize: p.pageSize || defaultPagination.pageSize }))}
				onEdit={(perm) => dispatch(openEditPermissionModal(perm))}
				onDelete={handleDelete}
			/>

			<PermissionFormModal open={modalOpen} editingPermission={editingPermission} submitting={submitting} onCancel={() => dispatch(closePermissionModal())} onSubmit={handleCreateOrUpdate} />
		</ListLayout>
	);
};

export default PermissionListPage;
