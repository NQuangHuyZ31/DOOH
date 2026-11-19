import React, { useEffect, useState } from 'react';
import { Form, Tabs, message } from 'antd';
import dayjs from 'dayjs';
import { CustomModal } from '@core/components/CustomModal';
import { useAppSelector } from '@core/store/hooks';
import { venueApi } from '../Action/venueApi';
import type { VenueItem } from '../types/venue';
import { VenueGeneralLocationTab } from './VenueGeneralLocationTab';
import { VenueOperationsTab } from './VenueOperationsTab';

interface VenueFormModalProps {
	open: boolean;
	initialValues?: VenueItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<VenueItem>) => Promise<void>;
}

export const VenueFormModal: React.FC<VenueFormModalProps> = ({ open, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const [generating, setGenerating] = useState(false);
	const [mediaOwners, setMediaOwners] = useState<Array<{ id: number; name: string; email: string }>>([]);
	const metadata = useAppSelector((state) => state.metadata.data);
	const currentUser = useAppSelector((state) => state.auth.user);
	const isSuperAdminOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
	const is247 = Form.useWatch('is_24_7', form);

	const venueTypeOptions = metadata?.enums?.venue_types || [];
	const statusOptions = metadata?.statuses?.venue || [];

	useEffect(() => {
		if (open && isSuperAdminOrAdmin) {
			venueApi
				.getMediaOwners()
				.then((res) => {
					if (res.data?.data) {
						setMediaOwners(res.data.data);
					}
				})
				.catch(() => {});
		}
	}, [open, isSuperAdminOrAdmin]);

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue({
					...initialValues,
					opening_time: initialValues.opening_time ? dayjs(initialValues.opening_time, 'HH:mm:ss') : dayjs('06:00:00', 'HH:mm:ss'),
					closing_time: initialValues.closing_time ? dayjs(initialValues.closing_time, 'HH:mm:ss') : dayjs('23:00:00', 'HH:mm:ss'),
				});
			} else {
				form.resetFields();
				form.setFieldsValue({
					venue_type: 'shopping_mall',
					country_code: 'VN',
					status: 'active',
					is_24_7: false,
					opening_time: dayjs('06:00:00', 'HH:mm:ss'),
					closing_time: dayjs('23:00:00', 'HH:mm:ss'),
					media_owner_id: currentUser?.id,
				});
			}
		}
	}, [open, initialValues, form, currentUser]);

	const handleAutoGenerateCode = async () => {
		const city = form.getFieldValue('city_province');
		const name = form.getFieldValue('name');
		if (!name) {
			message.warning('Please enter venue name first to generate code.');
			return;
		}
		setGenerating(true);
		try {
			const res = await venueApi.generateVenueCode(city, name);
			if (res.data?.data?.code) {
				form.setFieldValue('code', res.data.data.code);
				message.success(`Generated code: ${res.data.data.code}`);
			}
		} finally {
			setGenerating(false);
		}
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			const payload: Partial<VenueItem> = {
				...values,
				opening_time: values.is_24_7
					? '00:00:00'
					: values.opening_time && dayjs.isDayjs(values.opening_time)
						? values.opening_time.format('HH:mm:ss')
						: values.opening_time,
				closing_time: values.is_24_7
					? '23:59:59'
					: values.closing_time && dayjs.isDayjs(values.closing_time)
						? values.closing_time.format('HH:mm:ss')
						: values.closing_time,
			};
			await onSubmit(payload);
		} catch {
			// Form validation failure
		}
	};

	return (
		<CustomModal open={open} title={initialValues ? 'Edit Venue Location' : 'Create New Venue Location'} onOk={handleOk} onCancel={onCancel} confirmLoading={loading} width={680}>
			<Form form={form} layout="vertical">
				<Tabs
					defaultActiveKey="general"
					items={[
						{
							key: 'general',
							label: 'General & Location',
							children: <VenueGeneralLocationTab venueTypeOptions={venueTypeOptions} generating={generating} onAutoGenerateCode={handleAutoGenerateCode} />,
						},
						{
							key: 'operations',
							label: 'Operations & Contact',
							children: <VenueOperationsTab is247={Boolean(is247)} statusOptions={statusOptions} isSuperAdminOrAdmin={isSuperAdminOrAdmin} mediaOwners={mediaOwners} />,
						},
					]}
				/>
			</Form>
		</CustomModal>
	);
};

export default VenueFormModal;
