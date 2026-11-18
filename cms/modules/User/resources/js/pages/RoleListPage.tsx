import React, { useCallback, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { defaultPagination } from '@core/configs/pagination';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import type { FilterFieldConfig } from '@core/types/filter';
import { extractErrorMessage } from '@core/utils/error';
import { RoleFormModal } from '../components/RoleFormModal';
import { RoleTable } from '../components/RoleTable';
import { closeRoleModal, openCreateRoleModal, openEditRoleModal, setRoleFilters, setRolePagination } from '../store/roleSlice';
import { createRole, deleteRole, fetchRolePermissions, fetchRolesPaginated, updateRole } from '../store/roleThunk';
import type { RoleFilterParams, RoleFormData } from '../types/role';

export const RoleListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { roles, permissions, loading, submitting, filters, pagination, modalOpen, editingRole } = useAppSelector((state) => state.role);

	const loadRoles = useCallback(() => {
		dispatch(
			fetchRolesPaginated({
				...filters,
				page: pagination.current,
				per_page: pagination.pageSize,
			}),
		);
	}, [dispatch, filters, pagination.current, pagination.pageSize]);

	useEffect(() => {
		dispatch(fetchRolePermissions());
	}, [dispatch]);

	useEffect(() => {
		loadRoles();
	}, [loadRoles]);

	const handleFilterChange = (activeFilters: Record<string, unknown>) => {
		dispatch(setRoleFilters(activeFilters as RoleFilterParams));
	};

	const handleCreateOrUpdate = async (values: RoleFormData) => {
		try {
			if (editingRole) {
				await dispatch(updateRole({ id: editingRole.id, payload: values })).unwrap();
				message.success('Role updated successfully');
			} else {
				await dispatch(createRole(values)).unwrap();
				message.success('Role created successfully');
			}
			loadRoles();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Operation failed'));
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await dispatch(deleteRole(id)).unwrap();
			message.success('Role deleted successfully');
			loadRoles();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Delete failed'));
		}
	};

	const filterConfigs: FilterFieldConfig[] = useMemo(
		() => [
			{
				name: 'search',
				type: 'search',
				placeholder: 'Search by role name or description...',
				width: 300,
			},
		],
		[],
	);

	return (
		<ListLayout
			title="Role Management"
			description="Configure platform roles, assign permissions across modules, and manage user authorization levels"
			extraActions={
				<Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openCreateRoleModal())}>
					Add Role
				</Button>
			}
			filters={filterConfigs}
			onFilterChange={handleFilterChange}
		>
			<RoleTable
				roles={roles}
				loading={loading}
				pagination={pagination}
				onTableChange={(p) =>
					dispatch(
						setRolePagination({
							current: p.current || 1,
							pageSize: p.pageSize || defaultPagination.pageSize,
						}),
					)
				}
				onEdit={(r) => dispatch(openEditRoleModal(r))}
				onDelete={handleDelete}
			/>

			<RoleFormModal open={modalOpen} editingRole={editingRole} permissions={permissions} submitting={submitting} onCancel={() => dispatch(closeRoleModal())} onSubmit={handleCreateOrUpdate} />
		</ListLayout>
	);
};

export default RoleListPage;
