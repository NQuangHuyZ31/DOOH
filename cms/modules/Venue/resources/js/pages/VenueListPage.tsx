import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Space, Tabs, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DynamicFilterBar } from '@core/components/DynamicFilterBar';
import { ListLayout } from '@core/components/ListLayout';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { VenueStatsBar } from '../components/VenueStatsBar';
import { ScreenTable } from '../components/ScreenTable';
import { VenueTable } from '../components/VenueTable';
import { VenueFormModal } from '../components/VenueFormModal';
import { ScreenFormModal } from '../components/ScreenFormModal';
import { ScreenCredentialsModal } from '../components/ScreenCredentialsModal';
import { getScreenFilterConfigs } from '../configs/screenFilterConfigs';
import { getVenueFilterConfigs } from '../configs/venueFilterConfigs';
import { setScreenFilters, setVenueFilters } from '../store/venueSlice';
import { fetchVenues, fetchScreens, createVenue, updateVenue, deleteVenue, createScreen, updateScreen, deleteScreen } from '../store/venueThunk';
import type { VenueItem, ScreenItem, VenueQueryParams, ScreenQueryParams } from '../types/venue';

export const VenueListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { venues, venuePagination, venueFilters, screens, screenPagination, screenFilters, loading, submitting } = useAppSelector((state) => state.venue);
	const metadata = useAppSelector((state) => state.metadata.data);
	const [activeTab, setActiveTab] = useState<'screens' | 'venues'>('screens');
	const [venueModalOpen, setVenueModalOpen] = useState(false);
	const [screenModalOpen, setScreenModalOpen] = useState(false);
	const [editingVenue, setEditingVenue] = useState<VenueItem | null>(null);
	const [editingScreen, setEditingScreen] = useState<ScreenItem | null>(null);
	const [credentialsScreenId, setCredentialsScreenId] = useState<number | null>(null);

	const loadData = useCallback(() => {
		dispatch(fetchVenues({ ...venueFilters, per_page: venuePagination.pageSize || 15 }));
		dispatch(fetchScreens({ ...screenFilters, per_page: screenPagination.pageSize || 15 }));
	}, [dispatch, venueFilters, screenFilters, venuePagination.pageSize, screenPagination.pageSize]);

	useEffect(() => { loadData(); }, [loadData]);

	const handleSaveVenue = async (values: Partial<VenueItem>) => {
		try {
			if (editingVenue) { await dispatch(updateVenue({ id: editingVenue.id, payload: values })).unwrap(); }
			else { await dispatch(createVenue(values)).unwrap(); }
			message.success('Venue saved successfully.');
			setVenueModalOpen(false);
			dispatch(fetchVenues({ ...venueFilters, per_page: venuePagination.pageSize || 15 }));
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save venue.')); }
	};

	const handleSaveScreen = async (values: Partial<ScreenItem>) => {
		try {
			if (editingScreen) { await dispatch(updateScreen({ id: editingScreen.id, payload: values })).unwrap(); }
			else { await dispatch(createScreen(values)).unwrap(); }
			message.success('Screen registered successfully.');
			setScreenModalOpen(false);
			dispatch(fetchScreens({ ...screenFilters, per_page: screenPagination.pageSize || 15 }));
		} catch (err: unknown) { message.error(extractErrorMessage(err, 'Failed to save screen.')); }
	};

	const screenFilterConfigs = useMemo(() => getScreenFilterConfigs({
		venueOptions: venues.map((v) => ({ label: `${v.name} (${v.code})`, value: v.id })),
		screenTypeOptions: metadata?.enums?.screen_types,
		statusOptions: metadata?.statuses?.common || metadata?.statuses?.venue,
	}), [venues, metadata]);

	const venueFilterConfigs = useMemo(() => getVenueFilterConfigs({
		venueTypeOptions: metadata?.enums?.venue_types,
		statusOptions: metadata?.statuses?.venue,
	}), [metadata]);

	const renderActions = (
		<Space>
			<Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
			<Button type="primary" icon={<PlusOutlined />} onClick={() => {
				activeTab === 'screens' ? (setEditingScreen(null), setScreenModalOpen(true)) : (setEditingVenue(null), setVenueModalOpen(true));
			}}>
				{activeTab === 'screens' ? 'Register Screen' : 'Add Venue'}
			</Button>
		</Space>
	);

	const tabItems = [
		{
			key: 'screens',
			label: `Screens (${screenPagination.total || screens.length})`,
			children: (
				<Space direction="vertical" size="middle" style={{ width: '100%', padding: '12px 0' }}>
					<DynamicFilterBar filters={screenFilterConfigs} onChange={(f) => {
						dispatch(setScreenFilters(f as ScreenQueryParams));
						dispatch(fetchScreens({ ...f, page: 1, per_page: screenPagination.pageSize }));
					}} />
					<ScreenTable data={screens} loading={loading} pagination={{ ...screenPagination, onChange: (page, pageSize) => dispatch(fetchScreens({ ...screenFilters, page, per_page: pageSize })) }} onEdit={(item) => { setEditingScreen(item); setScreenModalOpen(true); }} onDelete={async (id) => { await dispatch(deleteScreen(id)).unwrap(); }} onPreview={(item) => message.info(`Launch Simulator for ${item.name} (${item.code})`)} onShowCredentials={(item) => setCredentialsScreenId(item.id)} />
				</Space>
			),
		},
		{
			key: 'venues',
			label: `Venues (${venuePagination.total || venues.length})`,
			children: (
				<Space direction="vertical" size="middle" style={{ width: '100%', padding: '12px 0' }}>
					<DynamicFilterBar filters={venueFilterConfigs} onChange={(f) => {
						dispatch(setVenueFilters(f as VenueQueryParams));
						dispatch(fetchVenues({ ...f, page: 1, per_page: venuePagination.pageSize }));
					}} />
					<VenueTable data={venues} loading={loading} pagination={{ ...venuePagination, onChange: (page, pageSize) => dispatch(fetchVenues({ ...venueFilters, page, per_page: pageSize })) }} onEdit={(item) => { setEditingVenue(item); setVenueModalOpen(true); }} onDelete={async (id) => { await dispatch(deleteVenue(id)).unwrap(); }} />
				</Space>
			),
		},
	];

	return (
		<ListLayout title="DOOH Screen & Venue Hub" description="Manage physical locations, screen display specs, Edge Player credentials and telemetry" extraActions={renderActions}>
			<VenueStatsBar venues={venues} screens={screens} />
			<Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'screens' | 'venues')} items={tabItems} />
			<VenueFormModal open={venueModalOpen} initialValues={editingVenue} loading={submitting} onCancel={() => setVenueModalOpen(false)} onSubmit={handleSaveVenue} />
			<ScreenFormModal open={screenModalOpen} venues={venues} initialValues={editingScreen} loading={submitting} onCancel={() => setScreenModalOpen(false)} onSubmit={handleSaveScreen} />
			<ScreenCredentialsModal open={credentialsScreenId !== null} screenId={credentialsScreenId} onClose={() => setCredentialsScreenId(null)} />
		</ListLayout>
	);
};

export default VenueListPage;
