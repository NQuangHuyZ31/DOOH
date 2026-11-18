import React from 'react';
import { Card, Flex, Space, Typography } from 'antd';
import { CheckCircleFilled, DesktopOutlined, SafetyCertificateFilled, ThunderboltFilled } from '@ant-design/icons';
import { AUTH_BRAND_CONFIG, LOGIN_HERO_FEATURES, LoginHeroFeature } from '../configs/authConfig';

const { Title, Text, Paragraph } = Typography;

const renderFeatureIcon = (feature: LoginHeroFeature) => {
	const style = { color: feature.color, fontSize: 18 };
	switch (feature.key) {
		case 'security':
			return <SafetyCertificateFilled style={style} />;
		case 'realtime':
			return <ThunderboltFilled style={style} />;
		case 'pacing':
			return <CheckCircleFilled style={style} />;
	}
};

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
							{AUTH_BRAND_CONFIG.name}
						</Title>
						<Text style={{ color: '#94a3b8', fontSize: 12 }}>{AUTH_BRAND_CONFIG.tagline}</Text>
					</div>
				</Flex>

				<Title level={2} style={{ color: '#f8fafc', fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>
					{AUTH_BRAND_CONFIG.headline}
				</Title>

				<Paragraph style={{ color: '#94a3b8', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>{AUTH_BRAND_CONFIG.description}</Paragraph>
			</div>

			<Card
				style={{
					background: 'rgba(255, 255, 255, 0.04)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					backdropFilter: 'blur(12px)',
					borderRadius: 14,
				}}
				styles={{ body: { padding: 20 } }}
			>
				<Space direction="vertical" size={12} style={{ width: '100%' }}>
					{LOGIN_HERO_FEATURES.map((feature) => (
						<Flex key={feature.key} align="center" gap={10}>
							{renderFeatureIcon(feature)}
							<Text style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{feature.label}</Text>
						</Flex>
					))}
				</Space>
			</Card>
		</div>
	);
};

export default LoginHeroBanner;
