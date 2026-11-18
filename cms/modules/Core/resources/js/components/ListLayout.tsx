import React from 'react';
import { Card, Flex, Space, Typography } from 'antd';
import type { FilterFieldConfig } from '../types/filter';
import { DynamicFilterBar } from './DynamicFilterBar';

const { Title, Paragraph } = Typography;

export interface ListLayoutProps {
	title: string;
	description?: string;
	extraActions?: React.ReactNode;
	filters?: FilterFieldConfig[];
	onFilterChange?: (values: Record<string, any>) => void;
	filterBar?: React.ReactNode;
	children: React.ReactNode;
}

export const ListLayout: React.FC<ListLayoutProps> = ({
	title,
	description,
	extraActions,
	filters,
	onFilterChange,
	filterBar,
	children,
}) => {
	const renderedFilter = filters && filters.length > 0 ? (
		<DynamicFilterBar filters={filters} onChange={onFilterChange || (() => {})} />
	) : (
		filterBar
	);

	return (
		<Space direction="vertical" size="middle" style={{ width: '100%' }}>
			<Flex justify="space-between" align="center">
				<div>
					<Title level={4} style={{ margin: 0 }}>
						{title}
					</Title>
					{description && (
						<Paragraph type="secondary" style={{ margin: 0 }}>
							{description}
						</Paragraph>
					)}
				</div>
				{extraActions && <Space>{extraActions}</Space>}
			</Flex>

			{renderedFilter && <Card size="small">{renderedFilter}</Card>}

			<Card styles={{ body: { padding: 0 } }}>{children}</Card>
		</Space>
	);
};

export default ListLayout;
