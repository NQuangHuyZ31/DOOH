import React from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined, SoundOutlined, StepForwardOutlined, AudioMutedOutlined, WifiOutlined } from '@ant-design/icons';
import { UREKA_COLORS } from '@core/configs/theme';
import type { ParsedVastResult, SimulatorScreenMeta, SimulatorSlot } from '../types/simulator';

interface LedFrameMockupProps {
	screen: SimulatorScreenMeta | null;
	activeSlot: SimulatorSlot | null;
	playCycle?: number;
	resolvedVast: ParsedVastResult | null;
	isPlaying: boolean;
	isMuted: boolean;
	isOffline: boolean;
	remainingSeconds: number;
	hasSlots: boolean;
	onTogglePlay: () => void;
	onToggleMute: () => void;
	onToggleOffline: () => void;
	onNext: () => void;
	onImpression: () => void;
	onComplete: () => void;
	onError: (reason: string) => void;
}

export const LedFrameMockup: React.FC<LedFrameMockupProps> = ({
	screen,
	activeSlot,
	playCycle = 0,
	resolvedVast,
	isPlaying,
	isMuted,
	isOffline,
	remainingSeconds,
	hasSlots,
	onTogglePlay,
	onToggleMute,
	onToggleOffline,
	onNext,
	onImpression,
	onComplete,
	onError,
}) => {
	const width = screen?.resolution_width || 1920;
	const height = screen?.resolution_height || 1080;
	const ratio = width / height;
	const frameMaxWidth = ratio < 1 ? 340 : ratio > 2.4 ? 860 : 720;
	const videoSrc = activeSlot?.type === 'video' ? activeSlot.media_url : activeSlot?.type === 'vast' ? resolvedVast?.primary_media_url || null : null;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
			<div
				style={{
					width: '100%',
					maxWidth: frameMaxWidth,
					background: '#111827',
					border: '10px solid #1f2937',
					borderRadius: 14,
					boxShadow: '0 16px 40px rgba(17, 24, 39, 0.35)',
					overflow: 'hidden',
					position: 'relative',
					aspectRatio: `${width} / ${height}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{!screen ? (
					<Typography.Text style={{ color: '#9ca3af' }}>Select or create a physical screen to preview</Typography.Text>
				) : !hasSlots ? (
					<Typography.Text style={{ color: '#9ca3af' }}>No active playlist slots synced for {screen.code}</Typography.Text>
				) : !isPlaying ? (
					<Space direction="vertical" align="center" size={10}>
						<Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={onTogglePlay} style={{ background: UREKA_COLORS.primary, borderColor: UREKA_COLORS.primary }}>
							Start Playback Simulation
						</Button>
						<Typography.Text style={{ color: '#9ca3af', fontSize: 12 }}>
							{screen.name} ({width}×{height} • {screen.orientation})
						</Typography.Text>
					</Space>
				) : activeSlot && videoSrc ? (
					<video
						key={`${playCycle}-${activeSlot.line_item_id}-${activeSlot.creative_id}-${videoSrc}`}
						src={videoSrc}
						autoPlay
						muted={isMuted}
						playsInline
						onPlay={onImpression}
						onEnded={onComplete}
						onError={() => onError(`Video failed to load: ${videoSrc}`)}
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : activeSlot?.type === 'image' ? (
					<img
						key={`${playCycle}-${activeSlot.line_item_id}-${activeSlot.creative_id}`}
						src={activeSlot.media_url}
						alt={activeSlot.line_item_name || 'Creative'}
						onLoad={onImpression}
						onError={() => onError(`Image failed to load: ${activeSlot.media_url}`)}
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : activeSlot?.type === 'html5' ? (
					<iframe
						key={`${playCycle}-${activeSlot.line_item_id}-${activeSlot.creative_id}`}
						src={activeSlot.media_url}
						title={activeSlot.line_item_name || 'HTML5 Ad'}
						sandbox="allow-scripts allow-same-origin"
						onLoad={onImpression}
						style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
					/>
				) : (
					<Typography.Text style={{ color: '#38bdf8' }}>Resolving VAST XML stream...</Typography.Text>
				)}

				{isPlaying && activeSlot && (
					<div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
						<Tag color="magenta" style={{ margin: 0 }}>
							{activeSlot.type.toUpperCase()}
						</Tag>
						<Tag color="#111827" style={{ margin: 0, border: '1px solid #374151' }}>
							{remainingSeconds}s
						</Tag>
					</div>
				)}
			</div>

			<Space wrap>
				<Button type="primary" icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} disabled={!hasSlots} onClick={onTogglePlay}>
					{isPlaying ? 'Pause' : 'Play'}
				</Button>
				<Button icon={<StepForwardOutlined />} disabled={!hasSlots || !isPlaying} onClick={onNext}>
					Next Slot
				</Button>
				<Tooltip title={isMuted ? 'Unmute audio' : 'Mute audio'}>
					<Button icon={isMuted ? <AudioMutedOutlined /> : <SoundOutlined />} onClick={onToggleMute}>
						{isMuted ? 'Muted' : 'Audio On'}
					</Button>
				</Tooltip>
				<Button danger={isOffline} icon={<WifiOutlined />} onClick={onToggleOffline}>
					{isOffline ? 'Offline Mode (Queueing)' : 'Online'}
				</Button>
			</Space>
		</div>
	);
};

export default LedFrameMockup;
