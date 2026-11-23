import React, { useState } from 'react';
import { Tabs } from 'antd';
import { ScheduleOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { ListLayout } from '@core/components/ListLayout';
import { useAppSelector } from '@core/store/hooks';
import { CampaignTab } from '../components/CampaignTab';
import { LineItemTab } from '../components/LineItemTab';

export const DeliveryDashboardPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'campaigns' | 'line-items'>('campaigns');
	const { campaignPagination, lineItemPagination } = useAppSelector((state) => state.delivery);

	const tabItems = [
		{
			key: 'campaigns',
			label: <span><ScheduleOutlined /> {`Campaigns (${campaignPagination.total || 0})`}</span>,
			children: <CampaignTab />,
		},
		{
			key: 'line-items',
			label: <span><UnorderedListOutlined /> {`Line Items & Pacing (${lineItemPagination.total || 0})`}</span>,
			children: <LineItemTab />,
		},
	];

	return (
		<ListLayout
			title="Ad Delivery & Pacing Engine"
			description="Manage advertiser campaigns, line item flight dates, daily impression caps, and live screen playlists."
		>
			<Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'campaigns' | 'line-items')} items={tabItems} />
		</ListLayout>
	);
};

export default DeliveryDashboardPage;
