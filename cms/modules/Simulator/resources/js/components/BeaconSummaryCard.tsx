import React from 'react';
import { Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CheckCircleOutlined, EyeOutlined, PercentageOutlined } from '@ant-design/icons';
import { UREKA_COLORS } from '@core/configs/theme';
import type { BeaconLineItemStat } from '../types/simulator';

interface BeaconSummaryCardProps {
	stats: Record<number, BeaconLineItemStat>;
}

export const BeaconSummaryCard: React.FC<BeaconSummaryCardProps> = ({ stats }) => {
	const items = Object.values(stats);
	const totalImp = items.reduce((sum, item) => sum + item.imp, 0);
	const totalComplete = items.reduce((sum, item) => sum + item.complete, 0);
	const totalFailed = items.reduce((sum, item) => sum + item.failed, 0);
	const completionRate = totalImp > 0 ? Math.round((totalComplete / totalImp) * 100) : 0;

	return (
		<Card
			size="small"
			title="Session Beacon Summary (IMP / COMPLETE)"
			extra={totalFailed > 0 && <Tag color="error">{`${totalFailed} failed`}</Tag>}
		>
			<Row gutter={[12, 12]} style={{ marginBottom: items.length > 0 ? 12 : 0 }}>
				<Col xs={8}>
					<Statistic title="Impressions (IMP)" value={totalImp} prefix={<EyeOutlined />} valueStyle={{ color: UREKA_COLORS.primary, fontSize: 20 }} />
				</Col>
				<Col xs={8}>
					<Statistic title="Completes (COMP)" value={totalComplete} prefix={<CheckCircleOutlined />} valueStyle={{ color: UREKA_COLORS.success, fontSize: 20 }} />
				</Col>
				<Col xs={8}>
					<Statistic title="Completion Rate" value={completionRate} suffix="%" prefix={<PercentageOutlined />} valueStyle={{ color: UREKA_COLORS.info, fontSize: 20 }} />
				</Col>
			</Row>

			{items.length === 0 ? (
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Start playback to accumulate IMP & COMPLETE counters" style={{ margin: '8px 0' }} />
			) : (
				<List
					size="small"
					bordered
					dataSource={items}
					renderItem={(item) => {
						const rate = item.imp > 0 ? Math.round((item.complete / item.imp) * 100) : 0;
						return (
							<List.Item style={{ padding: '6px 12px' }}>
								<Typography.Text strong style={{ fontSize: 13 }}>{item.lineItemName}</Typography.Text>
								<Space size={6}>
									<Tag color="magenta" style={{ margin: 0 }}>{`IMP: ${item.imp}`}</Tag>
									<Tag color="success" style={{ margin: 0 }}>{`COMP: ${item.complete}`}</Tag>
									<Tag color="cyan" style={{ margin: 0 }}>{`${rate}%`}</Tag>
									{item.failed > 0 && <Tag color="error" style={{ margin: 0 }}>{`ERR: ${item.failed}`}</Tag>}
								</Space>
							</List.Item>
						);
					}}
				/>
			)}
		</Card>
	);
};

export default BeaconSummaryCard;
