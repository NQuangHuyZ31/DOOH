import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { CustomModal } from '@core/components/CustomModal';
import { CAMPAIGN_STATUS_OPTIONS } from '../configs/deliveryFilterConfigs';
import type { CampaignItem } from '../types/delivery';

interface CampaignFormModalProps {
	open: boolean;
	initialValues?: CampaignItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<CampaignItem>) => Promise<void>;
}

export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ open, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const isEdit = Boolean(initialValues?.id);

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue({
					...initialValues,
					start_date: initialValues.start_date ? dayjs(initialValues.start_date) : undefined,
					end_date: initialValues.end_date ? dayjs(initialValues.end_date) : undefined,
				});
			} else {
				form.resetFields();
				form.setFieldsValue({
					status: 'active',
					start_date: dayjs(),
					end_date: dayjs().add(30, 'day'),
				});
			}
		}
	}, [open, initialValues, form]);

	const handleOk = async () => {
		const raw = await form.validateFields();
		const values: Partial<CampaignItem> = {
			...raw,
			start_date: raw.start_date ? raw.start_date.format('YYYY-MM-DD') : undefined,
			end_date: raw.end_date ? raw.end_date.format('YYYY-MM-DD') : undefined,
		};
		await onSubmit(values);
	};

	return (
		<CustomModal open={open} title={isEdit ? 'Edit Campaign' : 'Create New Campaign'} onCancel={onCancel} onOk={handleOk} confirmLoading={loading} width={640}>
			<Form form={form} layout="vertical">
				<Row gutter={16}>
					<Col span={10}>
						<Form.Item name="code" label="Campaign Code" tooltip="Leave blank to auto-generate (e.g. CMP-COCACOLA-1234)">
							<Input placeholder="Auto-generated" />
						</Form.Item>
					</Col>
					<Col span={14}>
						<Form.Item name="name" label="Campaign Name" rules={[{ required: true, message: 'Campaign name is required' }]}>
							<Input placeholder="e.g. Summer Refresh 2026" />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={12}>
						<Form.Item name="start_date" label="Start Date" rules={[{ required: true, message: 'Start date is required' }]}>
							<DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="end_date" label="End Date" rules={[{ required: true, message: 'End date is required' }]}>
							<DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={14}>
						<Form.Item name="total_budget" label="Total Budget (VND)">
							<InputNumber min={0} step={1000000} style={{ width: '100%' }} placeholder="e.g. 50000000" />
						</Form.Item>
					</Col>
					<Col span={10}>
						<Form.Item name="status" label="Status" rules={[{ required: true }]}>
							<Select options={CAMPAIGN_STATUS_OPTIONS} />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item name="description" label="Campaign Description">
					<Input.TextArea rows={3} placeholder="Objective, targeting notes, target KPI..." />
				</Form.Item>
			</Form>
		</CustomModal>
	);
};

export default CampaignFormModal;
