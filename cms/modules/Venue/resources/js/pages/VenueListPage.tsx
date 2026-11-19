import React, { useState, useEffect, useCallback } from 'react';
import { Button, Space, Tabs, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { VenueStatsBar } from '../components/VenueStatsBar';
import { ScreenTable } from '../components/ScreenTable';
import { VenueTable } from '../components/VenueTable';
import { VenueFormModal } from '../components/VenueFormModal';
import { ScreenFormModal } from '../components/ScreenFormModal';
import { ScreenCredentialsModal } from '../components/ScreenCredentialsModal';
import { fetchVenues, fetchScreens, createVenue, updateVenue, deleteVenue, createScreen, updateScreen, deleteScreen } from '../store/venueThunk';
import type { VenueItem, ScreenItem } from '../types/venue';

export const VenueListPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { venues, venuePagination, screens, screenPagination, loading, submitting } = useAppSelector((state) => state.venue);
	const [activeTab, setActiveTab] = useState<'screens' | 'venues'>('screens');
	const [venueModalOpen, setVenueModalOpen] = useState(false);
	const [screenModalOpen, setScreenModalOpen] = useState(false);
	const [editingVenue, setEditingVenue] = useState<VenueItem | null>(null);
	const [editingScreen, setEditingScreen] = useState<ScreenItem | null>(null);
	const [credentialsScreenId, setCredentialsScreenId] = useState<number | null>(null);

	const loadData = useCallback(() => {
		dispatch(fetchVenues({ per_page: 50 }));
		dispatch(fetchScreens({ per_page: 15 }));
	}, [dispatch]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleSaveVenue = async (values: Partial<VenueItem>) => {
		try {
			if (editingVenue) {
				await dispatch(updateVenue({ id: editingVenue.id, payload: values })).unwrap();
				message.success('Venue updated successfully.');
			} else {
				await dispatch(createVenue(values)).unwrap();
				message.success('Venue created successfully.');
			}
			setVenueModalOpen(false);
			dispatch(fetchVenues({ per_page: 50 }));
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to save venue.'));
		}
	};

	const handleSaveScreen = async (values: Partial<ScreenItem>) => {
		try {
			if (editingScreen) {
				await dispatch(updateScreen({ id: editingScreen.id, payload: values })).unwrap();
				message.success('Screen updated successfully.');
			} else {
				await dispatch(createScreen(values)).unwrap();
				message.success('Screen registered successfully.');
			}
			setScreenModalOpen(false);
			dispatch(fetchScreens({ per_page: 15 }));
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to save screen.'));
		}
	};

	const renderActions = (
		<Space>
			<Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
			<Button
				type="primary"
				icon={<PlusOutlined />}
				onClick={() => {
					if (activeTab === 'screens') {
						setEditingScreen(null);
						setScreenModalOpen(true);
					} else {
						setEditingVenue(null);
						setVenueModalOpen(true);
					}
				}}
			>
				{activeTab === 'screens' ? 'Register Screen' : 'Add Venue'}
			</Button>
		</Space>
	);

	const tabItems = [
		{
			key: 'screens',
			label: `Screens (${screens.length})`,
			children: (
				<ScreenTable
					data={screens}
					loading={loading}
					pagination={{ ...screenPagination, onChange: (page, pageSize) => dispatch(fetchScreens({ page, per_page: pageSize })) }}
					onEdit={(item) => { setEditingScreen(item); setScreenModalOpen(true); }}
					onDelete={async (id) => { await dispatch(deleteScreen(id)).unwrap(); }}
					onPreview={(item) => message.info(`Launch Simulator for ${item.name} (${item.code})`)}
					onShowCredentials={(item) => setCredentialsScreenId(item.id)}
				/>
			),
		},
		{
			key: 'venues',
			label: `Venues (${venues.length})`,
			children: (
				<VenueTable
					data={venues}
					loading={loading}
					pagination={{ ...venuePagination, onChange: (page, pageSize) => dispatch(fetchVenues({ page, per_page: pageSize })) }}
					onEdit={(item) => { setEditingVenue(item); setVenueModalOpen(true); }}
					onDelete={async (id) => { await dispatch(deleteVenue(id)).unwrap(); }}
				/>
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
