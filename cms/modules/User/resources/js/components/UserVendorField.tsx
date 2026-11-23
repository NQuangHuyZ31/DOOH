import React, { useEffect, useMemo } from 'react';
import { Form, Select } from 'antd';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { fetchVendors } from '@modules/Vendor/resources/js/store/vendorThunk';
import type { RoleItem } from '../types/role';

interface UserVendorFieldProps {
	roles: RoleItem[];
	initialVendor?: { id: number; name: string; code: string } | null;
}

export const UserVendorField: React.FC<UserVendorFieldProps> = ({ roles, initialVendor }) => {
	const dispatch = useAppDispatch();
	const roleId = Form.useWatch('role_id');
	const selectedRole = roles.find((r) => r.id === roleId);
	const isMediaOwner = selectedRole?.name === 'media_owner';

	const vendors = useAppSelector((state) => state.vendor?.vendors || []);
	const loading = useAppSelector((state) => state.vendor?.loading || false);

	useEffect(() => {
		if (isMediaOwner && vendors.length === 0) {
			dispatch(fetchVendors({ per_page: 100 }));
		}
	}, [isMediaOwner, vendors.length, dispatch]);

	const options = useMemo(() => vendors.map((v) => ({ label: `${v.name} (${v.code})`, value: v.id })), [vendors]);

	if (!isMediaOwner) {
		return null;
	}

	return (
		<Form.Item name="vendor_id" label="Linked Media Owner / Vendor" tooltip="Associate this user with an existing registered Vendor">
			<Select placeholder="Select existing Vendor" allowClear options={options} loading={loading} defaultValue={initialVendor?.id} />
		</Form.Item>
	);
};

export default UserVendorField;
