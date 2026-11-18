import React, { useCallback, useEffect, useMemo } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import type { FilterFieldConfig } from '@core/types/filter';
import { extractErrorMessage } from '@core/utils/error';
import { UserFormModal } from '../components/UserFormModal';
import { UserTable } from '../components/UserTable';
import { closeUserModal, openCreateUserModal, openEditUserModal, setUserFilters, setUserPagination } from '../store/userSlice';
import { createUser, deleteUser, fetchPermissions, fetchRoles, fetchUsers, updateUser } from '../store/userThunk';
import type { UserFilterParams, UserFormData } from '../types/user';

export const UserListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { users, roles, permissions, loading, submitting, filters, pagination, modalOpen, editingUser } = useAppSelector((state) => state.user);

	const loadUsers = useCallback(() => {
		dispatch(
			fetchUsers({
				...filters,
				page: pagination.current,
				per_page: pagination.pageSize,
			}),
		);
	}, [dispatch, filters, pagination.current, pagination.pageSize]);

	useEffect(() => {
		dispatch(fetchRoles());
		dispatch(fetchPermissions());
	}, [dispatch]);

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	const handleFilterChange = (activeFilters: Record<string, unknown>) => {
		dispatch(setUserFilters(activeFilters as UserFilterParams));
	};

	const handleCreateOrUpdate = async (values: UserFormData) => {
		try {
			if (editingUser) {
				await dispatch(updateUser({ id: editingUser.id, payload: values })).unwrap();
				message.success('User updated successfully');
			} else {
				await dispatch(createUser(values)).unwrap();
				message.success('User created successfully');
			}
			loadUsers();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Operation failed'));
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await dispatch(deleteUser(id)).unwrap();
			message.success('User deleted successfully');
			loadUsers();
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Delete failed'));
		}
	};

	const filterConfigs: FilterFieldConfig[] = useMemo(
		() => [
			{ name: 'search', type: 'search', placeholder: 'Search by name or email...', width: 260 },
			{
				name: 'role',
				type: 'select',
				placeholder: 'Filter by Role',
				width: 160,
				options: roles.map((r) => ({ label: r.display_name, value: r.name })),
			},
			{
				name: 'permission_type',
				type: 'select',
				placeholder: 'Permission Mode',
				width: 170,
				options: [
					{ label: 'Role-based', value: 'role' },
					{ label: 'Direct Permissions', value: 'direct' },
				],
			},
		],
		[roles],
	);

	return (
		<ListLayout
			title="User Management"
			description="Manage platform user accounts, role assignments, and direct module permissions"
			extraActions={
				<Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openCreateUserModal())}>
					Add User
				</Button>
			}
			filters={filterConfigs}
			onFilterChange={handleFilterChange}
		>
			<UserTable
				users={users}
				loading={loading}
				pagination={pagination}
				onTableChange={(p) => dispatch(setUserPagination({ current: p.current || 1, pageSize: p.pageSize || 15 }))}
				onEdit={(u) => dispatch(openEditUserModal(u))}
				onDelete={handleDelete}
			/>

			<UserFormModal open={modalOpen} editingUser={editingUser} roles={roles} permissions={permissions} submitting={submitting} onCancel={() => dispatch(closeUserModal())} onSubmit={handleCreateOrUpdate} />
		</ListLayout>
	);
};

export default UserListPage;
