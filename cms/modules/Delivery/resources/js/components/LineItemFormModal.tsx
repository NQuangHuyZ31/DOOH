import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';
import { CustomModal } from '@core/components/CustomModal';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { calcOrientation } from '@core/utils/mediaExtractor';
import { fetchVenues, fetchScreens } from '@modules/Venue/resources/js/store/venueThunk';
import { fetchCreatives } from '@modules/Creative/resources/js/store/creativeThunk';
import { creativeApi } from '@modules/Creative/resources/js/Action/creativeApi';
import { CreativeFormModal } from '@modules/Creative/resources/js/components/CreativeFormModal';
import type { CreativeFormData, CreativeItem } from '@modules/Creative/resources/js/types/creative';
import { CreativeLibraryModal } from './CreativeLibraryModal';
import { LineItemCreativeList } from './LineItemCreativeList';
import { LineItemFormFields } from './LineItemFormFields';
import type { LineItem, CampaignItem, LineItemCreativeItem } from '../types/delivery';

interface LineItemFormModalProps {
	open: boolean;
	campaigns: CampaignItem[];
	initialValues?: LineItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<LineItem> & { screen_ids?: number[]; venue_ids?: number[]; creatives?: Array<{ id: number; weight: number }> }) => Promise<void>;
}

export const LineItemFormModal: React.FC<LineItemFormModalProps> = ({ open, campaigns, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const dispatch = useAppDispatch();
	const isEdit = Boolean(initialValues?.id);
	const venues = useAppSelector((state) => state.venue?.venues || []);
	const screens = useAppSelector((state) => state.venue?.screens || []);
	const metadata = useAppSelector((state) => state.metadata.data);
	const orientationOptions = metadata?.enums?.orientations || [{ value: 'landscape', label: 'Landscape (16:9 Standard)' }, { value: 'portrait', label: 'Portrait (9:16 Standard)' }];
	const [attachedCreatives, setAttachedCreatives] = useState<LineItemCreativeItem[]>([]);
	const [libraryOpen, setLibraryOpen] = useState(false);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [submittingCreative, setSubmittingCreative] = useState(false);
	const currentOrientation = Form.useWatch('orientation', form) || 'landscape';

	useEffect(() => {
		if (open) {
			if (venues.length === 0) dispatch(fetchVenues({ per_page: 100 }));
			if (screens.length === 0) dispatch(fetchScreens({ per_page: 100 }));
			if (initialValues) {
				form.setFieldsValue({
					...initialValues,
					start_date: initialValues.start_date ? dayjs(initialValues.start_date) : undefined,
					end_date: initialValues.end_date ? dayjs(initialValues.end_date) : undefined,
					screen_ids: initialValues.screens?.map((s) => s.id) || [],
				});
				const existingCr = initialValues.creatives?.length ? initialValues.creatives : initialValues.creative ? [{ ...initialValues.creative, weight: 1 }] : [];
				setAttachedCreatives(existingCr as LineItemCreativeItem[]);
			} else {
				form.resetFields();
				form.setFieldsValue({ priority: 5, pacing_mode: 'evenly', orientation: 'landscape', status: 'active', target_impressions: 10000, daily_impression_cap: 1000, start_date: dayjs(), end_date: dayjs().add(14, 'day') });
				setAttachedCreatives([]);
			}
		}
	}, [open, initialValues, form, dispatch, venues.length, screens.length]);

	const handleOrientationChange = (newOrient: string) => {
		form.setFieldsValue({ orientation: newOrient });
		if (newOrient === 'custom') return;
		const cleanCr = attachedCreatives.filter((c) => calcOrientation(c.width || 1920, c.height || 1080) === newOrient);
		const curScreenIds: number[] = form.getFieldValue('screen_ids') || [];
		const cleanScr = screens.filter((s) => curScreenIds.includes(s.id) && (s.orientation === newOrient || s.orientation === 'custom')).map((s) => s.id);
		setAttachedCreatives(cleanCr);
		form.setFieldsValue({ screen_ids: cleanScr });
		if (cleanCr.length !== attachedCreatives.length || cleanScr.length !== curScreenIds.length) {
			message.warning(`Switched to ${newOrient.toUpperCase()}. Incompatible creatives/screens were automatically unlinked.`);
		}
	};

	const handleCreativeModalSave = async (items: CreativeFormData[]) => {
		try {
			setSubmittingCreative(true);
			const res = items.length === 1 ? await creativeApi.createCreative(items[0]) : await creativeApi.createBatch(items);
			const createdItems: CreativeItem[] = Array.isArray(res.data?.data) ? res.data.data : res.data?.data ? [res.data.data] : [];
			const matched = createdItems.filter((c) => currentOrientation === 'custom' || calcOrientation(c.width || 1920, c.height || 1080) === currentOrientation);
			if (matched.length < createdItems.length) { message.warning(`${createdItems.length - matched.length} creative(s) skipped due to orientation mismatch.`); }
			const newCr: LineItemCreativeItem[] = matched.map((c) => ({
				id: c.id, name: c.name, code: c.code, type: c.type, status: c.status, media_url: c.media_url, width: c.width, height: c.height, duration_seconds: c.duration_seconds, weight: 1,
			}));
			setAttachedCreatives((p) => [...p, ...newCr]);
			dispatch(fetchCreatives({ per_page: 100 }));
			setUploadOpen(false);
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save creatives.')); }
		finally { setSubmittingCreative(false); }
	};

	const handleOk = async () => {
		const raw = await form.validateFields();
		if (raw.orientation !== 'custom') {
			const badCr = attachedCreatives.filter((c) => calcOrientation(c.width || 1920, c.height || 1080) !== raw.orientation);
			if (badCr.length > 0) return message.error(`Cannot save: ${badCr.length} creative(s) do not match ${raw.orientation} orientation.`);
		}
		const selScreens = screens.filter((s) => (raw.screen_ids || []).includes(s.id));
		if (raw.orientation !== 'custom') {
			const badScr = selScreens.filter((s) => s.orientation !== raw.orientation && s.orientation !== 'custom');
			if (badScr.length > 0) return message.error(`Cannot save: Screen '${badScr[0].name}' (${badScr[0].orientation}) does not match ${raw.orientation}.`);
		}
		await onSubmit({
			...raw,
			start_date: raw.start_date ? raw.start_date.format('YYYY-MM-DD') : undefined,
			end_date: raw.end_date ? raw.end_date.format('YYYY-MM-DD') : undefined,
			venue_ids: Array.from(new Set(selScreens.map((s) => s.venue_id))),
			creatives: attachedCreatives.map((c) => ({ id: c.id, weight: c.weight || 1 })),
		});
	};

	return (
		<CustomModal open={open} title={isEdit ? `Edit Line Item: ${initialValues?.name}` : 'Create New Line Item'} onCancel={onCancel} onOk={handleOk} confirmLoading={loading} width={1140}>
			<Form form={form} layout="vertical">
				<LineItemFormFields form={form} campaigns={campaigns} venues={venues} screens={screens} currentOrientation={currentOrientation} orientationOptions={orientationOptions} onOrientationChange={handleOrientationChange} />
				<LineItemCreativeList creatives={attachedCreatives} currentOrientation={currentOrientation} onOpenLibrary={() => setLibraryOpen(true)} onOpenUpload={() => setUploadOpen(true)} onChange={setAttachedCreatives} onRemove={(id) => setAttachedCreatives((p) => p.filter((c) => c.id !== id))} />
			</Form>
			<CreativeLibraryModal open={libraryOpen} targetOrientation={currentOrientation} alreadyAttachedIds={attachedCreatives.map((c) => c.id)} onCancel={() => setLibraryOpen(false)} onConfirm={(s) => { setAttachedCreatives((p) => [...p, ...s.filter((x) => !new Set(p.map((c) => c.id)).has(x.id))]); setLibraryOpen(false); }} />
			<CreativeFormModal open={uploadOpen} targetOrientation={currentOrientation} submitting={submittingCreative} onCancel={() => setUploadOpen(false)} onSave={handleCreativeModalSave} />
		</CustomModal>
	);
};

export default LineItemFormModal;
