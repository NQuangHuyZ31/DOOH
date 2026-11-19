import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Modal, Select, Tag, Space, Alert } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import L from 'leaflet';
import type { VenueItem } from '../types/venue';

interface VenueMapModalProps {
	open: boolean;
	venues: VenueItem[];
	onCancel: () => void;
}

export const VenueMapModal: React.FC<VenueMapModalProps> = ({ open, venues, onCancel }) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const markersRef = useRef<Record<number, L.Marker>>({});
	const [modalReady, setModalReady] = useState(false);
	const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

	const mappedVenues = useMemo(
		() => venues.filter((v) => v.latitude != null && v.longitude != null && !isNaN(Number(v.latitude)) && !isNaN(Number(v.longitude))),
		[venues],
	);

	useEffect(() => {
		if (!modalReady || !mapContainerRef.current) return;

		const map = L.map(mapContainerRef.current).setView([10.7769, 106.7009], 12);
		mapInstanceRef.current = map;
		markersRef.current = {};

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '© OpenStreetMap contributors',
		}).addTo(map);

		mappedVenues.forEach((v) => {
			const color = v.status === 'active' ? '#1890ff' : v.status === 'maintenance' ? '#faad14' : '#ff4d4f';
			const pinIcon = L.divIcon({
				className: 'custom-venue-pin',
				html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
				iconSize: [24, 24],
				iconAnchor: [12, 24],
				popupAnchor: [0, -24],
			});

			const popupContent = `
				<div style="font-size: 13px; line-height: 1.4; padding: 2px;">
					<div style="font-weight: 700; color: #1e293b; font-size: 14px;">${v.name}</div>
					<div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">[${v.code}] • ${v.venue_type || 'General'}</div>
					<div style="color: #475569; margin-bottom: 6px;">📍 ${v.address || ''} ${v.city_province || ''}</div>
					<div style="display: flex; gap: 6px; font-size: 12px;">
						<span style="background: #e0f2fe; color: #0284c7; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Screens: ${v.screens_count ?? 0}</span>
						<span style="background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px;">OTS: ${(v.daily_traffic ?? 0).toLocaleString()}</span>
					</div>
				</div>
			`;

			markersRef.current[v.id] = L.marker([Number(v.latitude), Number(v.longitude)], { icon: pinIcon })
				.addTo(map)
				.bindPopup(popupContent);
		});

		map.invalidateSize();
		if (mappedVenues.length > 0 && map.getSize().x > 0) {
			const bounds = L.latLngBounds(mappedVenues.map((v) => [Number(v.latitude), Number(v.longitude)]));
			map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
		}

		const timer = setTimeout(() => map.invalidateSize(), 200);

		return () => {
			clearTimeout(timer);
			map.remove();
			mapInstanceRef.current = null;
		};
	}, [modalReady, mappedVenues]);

	const handleSelectVenue = (venueId: number) => {
		setSelectedVenueId(venueId);
		const v = mappedVenues.find((item) => item.id === venueId);
		const map = mapInstanceRef.current;
		const marker = markersRef.current[venueId];

		if (v && map && marker) {
			map.flyTo([Number(v.latitude), Number(v.longitude)], 16, { duration: 1.2 });
			marker.openPopup();
		}
	};

	return (
		<Modal
			open={open}
			title={
				<Space>
					<CompassOutlined style={{ color: '#1890ff' }} />
					<span>DOOH Venues Geographic Map</span>
					<Tag color="blue">{`${mappedVenues.length}/${venues.length} mapped`}</Tag>
				</Space>
			}
			onCancel={() => {
				setModalReady(false);
				onCancel();
			}}
			afterOpenChange={(isOpen) => setModalReady(isOpen)}
			footer={null}
			width={1000}
			destroyOnClose
		>
			<style>{`
				.leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
				.leaflet-tile-container, .leaflet-layer { position: absolute !important; left: 0; top: 0; }
				.leaflet-container { overflow: hidden; position: relative; width: 100%; height: 100%; }
			`}</style>
			<div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
				<Select
					showSearch
					style={{ flex: 1 }}
					placeholder="Quick search & fly to venue on map..."
					optionFilterProp="label"
					value={selectedVenueId}
					onChange={handleSelectVenue}
					options={mappedVenues.map((v) => ({
						value: v.id,
						label: `${v.name} (${v.code}) — ${v.city_province || 'VN'}`,
					}))}
				/>
				{venues.length > mappedVenues.length && (
					<Alert type="warning" showIcon message={`${venues.length - mappedVenues.length} venue(s) missing GPS`} style={{ padding: '4px 8px', fontSize: 12 }} />
				)}
			</div>
			<div ref={mapContainerRef} style={{ height: 560, width: '100%', borderRadius: 8, border: '1px solid #e2e8f0' }} />
		</Modal>
	);
};

export default VenueMapModal;
