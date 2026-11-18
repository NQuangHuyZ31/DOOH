import type React from 'react';
import { UREKA_COLORS } from '@core/configs/theme';

export interface LoginHeroFeature {
	key: 'security' | 'realtime' | 'pacing';
	color: string;
	label: string;
}

export const AUTH_BRAND_CONFIG = {
	name: 'Ureka Media DOOH',
	tagline: 'Next-Gen Digital Out-Of-Home Operations',
	headline: 'High-performance DOOH network with enterprise reliability.',
	description:
		'Manage digital billboard loops, flight pacing schedules, real-time proof-of-play tracking, and secure administrative access.',
} as const;

export const LOGIN_HERO_FEATURES: LoginHeroFeature[] = [
	{
		key: 'security',
		color: UREKA_COLORS.success,
		label: 'Enterprise Sanctum RBAC & Multi-factor Protection',
	},
	{
		key: 'realtime',
		color: UREKA_COLORS.info,
		label: 'Real-Time Proof-of-Play Tracking (< 3ms Ingest)',
	},
	{
		key: 'pacing',
		color: UREKA_COLORS.primary,
		label: 'Dynamic 120s Playlist & SOV Flight Optimizer',
	},
];

export const AUTH_PRIMARY_BUTTON_STYLE: React.CSSProperties = {
	height: 44,
	fontWeight: 600,
	borderRadius: 8,
	background: UREKA_COLORS.gradientPrimary,
	border: 'none',
};

export const AUTH_PAGE_WRAPPER_STYLE: React.CSSProperties = {
	minHeight: '100vh',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	background: 'radial-gradient(circle at 10% 20%, #1A161F 0%, #0d0a10 100%)',
	padding: 24,
};

export const AUTH_CARD_STYLE: React.CSSProperties = {
	width: '100%',
	maxWidth: 960,
	borderRadius: 20,
	overflow: 'hidden',
	border: '1px solid rgba(255, 255, 255, 0.08)',
	boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
};
