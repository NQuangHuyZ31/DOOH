import React from 'react';
import { Card, Flex, Space, Typography } from 'antd';
import { CheckCircleFilled, DesktopOutlined, SafetyCertificateFilled, ThunderboltFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const LoginHeroBanner: React.FC = () => {
	return (
		<div
			style={{
				flex: 1,
				padding: '48px 40px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				background: 'linear-gradient(145deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)',
				borderRight: '1px solid rgba(255, 255, 255, 0.08)',
				color: '#ffffff',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: -80,
					right: -80,
					width: 260,
					height: 260,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(22, 119, 255, 0.25) 0%, transparent 70%)',
					filter: 'blur(40px)',
					pointerEvents: 'none',
				}}
			/>

			<div>
				<Flex align="center" gap={12} style={{ marginBottom: 32 }}>
					<div
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							background: 'linear-gradient(135deg, #1677ff 0%, #06b6d4 100%)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 14px rgba(22, 119, 255, 0.4)',
						}}
					>
						<DesktopOutlined style={{ color: '#ffffff', fontSize: 22 }} />
					</div>
					<div>
						<Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>
							DOOH CMS
						</Title>
						<Text style={{ color: '#94a3b8', fontSize: 12 }}>Next-Gen Digital Out-Of-Home Operations</Text>
					</div>
				</Flex>

				<Title level={2} style={{ color: '#f8fafc', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
					High-performance DOOH network with enterprise reliability.
				</Title>

				<Paragraph style={{ color: '#94a3b8', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
					Manage digital billboard loops, flight pacing schedules, real-time proof-of-play tracking, and secure administrative access.
				</Paragraph>
			</div>

			<Card
				style={{
					background: 'rgba(255, 255, 255, 0.04)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					backdropFilter: 'blur(12px)',
					borderRadius: 14,
				}}
				styles={{ body: { padding: '20px' } }}
			>
				<Space direction="vertical" size={12} style={{ width: '100%' }}>
					<Flex align="center" gap={10}>
						<SafetyCertificateFilled style={{ color: '#10b981', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Enterprise Sanctum RBAC & Multi-factor Protection</Text>
					</Flex>
					<Flex align="center" gap={10}>
						<ThunderboltFilled style={{ color: '#38bdf8', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Real-Time Proof-of-Play Tracking (&lt; 3ms Ingest)</Text>
					</Flex>
					<Flex align="center" gap={10}>
						<CheckCircleFilled style={{ color: '#a855f7', fontSize: 18 }} />
						<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>Dynamic 120s Playlist & SOV Flight Optimizer</Text>
					</Flex>
				</Space>
			</Card>
		</div>
	);
};

export default LoginHeroBanner;
