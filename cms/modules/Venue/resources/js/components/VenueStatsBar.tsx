import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { ShopOutlined, DesktopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { VenueItem, ScreenItem } from '../types/venue';

interface VenueStatsBarProps {
	venues: VenueItem[];
	screens: ScreenItem[];
}

export const VenueStatsBar: React.FC<VenueStatsBarProps> = ({ venues, screens }) => {
	const onlineScreens = screens.filter((s) => s.connectivity_status === 'online').length;
	const offlineScreens = screens.filter((s) => s.connectivity_status === 'offline').length;
	const totalTraffic = venues.reduce((sum, v) => sum + (v.daily_traffic || 0), 0);

	return (
		<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
			<Col xs={24} sm={12} md={6}>
				<Card size="small" variant="borderless" style={{ background: '#fafafa' }}>
					<Statistic title="Total Venues" value={venues.length} prefix={<ShopOutlined style={{ color: '#652E8D' }} />} />
				</Card>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<Card size="small" variant="borderless" style={{ background: '#fafafa' }}>
					<Statistic title="Total Screens" value={screens.length} prefix={<DesktopOutlined style={{ color: '#0999D6' }} />} />
				</Card>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<Card size="small" variant="borderless" style={{ background: '#fafafa' }}>
					<Statistic
						title="Online Edge Devices"
						value={onlineScreens}
						suffix={<span style={{ fontSize: 12, color: '#8c8c8c' }}>/ {offlineScreens} offline</span>}
						valueStyle={{ color: '#74BE44' }}
						prefix={<CheckCircleOutlined />}
					/>
				</Card>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<Card size="small" variant="borderless" style={{ background: '#fafafa' }}>
					<Statistic title="Estimated Daily Traffic" value={totalTraffic} formatter={(val) => Number(val).toLocaleString()} prefix={<span style={{ fontSize: 14, color: '#EA088B', fontWeight: 'bold' }}>OTS</span>} />
				</Card>
			</Col>
		</Row>
	);
};

export default VenueStatsBar;
