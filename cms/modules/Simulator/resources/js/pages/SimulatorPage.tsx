import React from 'react';
import { Alert, Card, Col, Row, Space } from 'antd';
import { toScreenMeta } from '../Action/simulatorApi';
import { usePlayerEngine } from '../hooks/usePlayerEngine';
import { useSimulatorActions } from '../hooks/useSimulatorActions';
import { SimulatorToolbar } from '../components/SimulatorToolbar';
import { PartnerScreenList } from '../components/PartnerScreenList';
import { LocalScreenFormModal } from '../components/LocalScreenFormModal';
import { SyncApiKeyModal } from '../components/SyncApiKeyModal';
import { LedFrameMockup } from '../components/LedFrameMockup';
import { BeaconSummaryCard } from '../components/BeaconSummaryCard';
import { EventDebugPanel } from '../components/EventDebugPanel';

export const SimulatorPage: React.FC = () => {
	const sim = useSimulatorActions();
	const engine = usePlayerEngine(sim.playlistData, sim.handleFetchNodePlaylist, sim.selectedScreen);
	const activeScreenMeta = sim.selectedScreen ? toScreenMeta(sim.selectedScreen) : null;

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<SimulatorToolbar
				syncedScreens={sim.syncedScreens}
				selectedScreen={sim.selectedScreen}
				loadingPlaylist={sim.loadingPlaylist}
				onSelectScreen={(id) => {
					const found = sim.syncedScreens.find((s) => s.id === id);
					if (found) sim.handleLoadScreen(found);
				}}
				onFetchPlaylist={() => sim.handleFetchNodePlaylist(sim.selectedScreen)}
				onOpenCreateModal={() => sim.setCreateModalOpen(true)}
			/>
			<PartnerScreenList
				screens={sim.localScreens}
				selectedScreenId={sim.selectedScreenId}
				syncingScreenId={sim.syncingScreenId}
				batchSyncing={sim.batchSyncing}
				loading={sim.loadingScreens}
				onSyncToCms={(screen) => sim.setSyncTargets([screen])}
				onBatchSyncAll={(unsynced) => sim.setSyncTargets(unsynced)}
				onLoadPlayer={sim.handleLoadScreen}
				onDelete={sim.handleDeleteScreen}
			/>
			{sim.error && <Alert type="error" message={sim.error} showIcon />}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={15}>
					<Space direction="vertical" size={16} style={{ width: '100%' }}>
						<Card size="small" title={activeScreenMeta ? `LED Display: ${activeScreenMeta.name} [${activeScreenMeta.code}]` : 'LED Display Mockup'}>
							<LedFrameMockup
								screen={activeScreenMeta}
								activeSlot={engine.activeSlot}
								playCycle={engine.playCycle}
								resolvedVast={engine.resolvedVast}
								isPlaying={engine.isPlaying}
								isMuted={engine.isMuted}
								isOffline={engine.isOffline}
								remainingSeconds={engine.remainingSeconds}
								hasSlots={(sim.playlistData?.playlist.length || 0) > 0}
								onTogglePlay={() => engine.setIsPlaying((p) => !p)}
								onToggleMute={() => engine.setIsMuted((m) => !m)}
								onToggleOffline={() => engine.setIsOffline((o) => !o)}
								onNext={engine.nextSlot}
								onImpression={engine.fireImpression}
								onComplete={engine.fireCompleteAndAdvance}
								onError={engine.handleMediaError}
							/>
						</Card>
						<BeaconSummaryCard stats={sim.beaconStats} />
					</Space>
				</Col>
				<Col xs={24} lg={9}>
					<EventDebugPanel playlistData={sim.playlistData} activeIndex={engine.activeIndex} remainingSeconds={engine.remainingSeconds} refreshCountdown={engine.refreshCountdown} offlineQueuedCount={engine.offlineQueuedCount} beaconLogs={sim.beaconLogs} onSelectSlot={engine.jumpToSlot} onClearLogs={sim.handleClearLogs} />
				</Col>
			</Row>
			<LocalScreenFormModal open={sim.createModalOpen} loading={sim.submitting} onCancel={() => sim.setCreateModalOpen(false)} onSubmit={sim.handleCreateLocalScreen} />
			<SyncApiKeyModal open={sim.syncTargets.length > 0} targets={sim.syncTargets} loading={sim.syncingScreenId !== null || sim.batchSyncing} onCancel={() => sim.setSyncTargets([])} onConfirm={sim.handleConfirmSync} />
		</Space>
	);
};

export default SimulatorPage;
