import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '@core/store/hooks';
import { simulatorApi } from '../Action/simulatorApi';
import { appendBeaconLog } from '../store/simulatorSlice';
import type { BeaconLogEntry, ParsedVastResult, SimulatorPlaylistData, SimulatorScreenItem, SimulatorSlot } from '../types/simulator';

interface QueuedBeacon {
	url: string;
	event: 'IMP' | 'COMPLETE' | 'VAST_IMP' | 'VAST_COMPLETE';
	lineItemId?: number;
	lineItemName?: string;
}

const makeLog = (partial: Omit<BeaconLogEntry, 'id' | 'timestamp'>): BeaconLogEntry => ({
	id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
	...partial,
});

export const usePlayerEngine = (playlistData: SimulatorPlaylistData | null, onAutoRefresh: () => void, selectedScreen: SimulatorScreenItem | null = null) => {
	const dispatch = useAppDispatch();
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(true);
	const [isOffline, setIsOffline] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [remainingSeconds, setRemainingSeconds] = useState(0);
	const [refreshCountdown, setRefreshCountdown] = useState(0);
	const [resolvedVast, setResolvedVast] = useState<ParsedVastResult | null>(null);

	const offlineQueueRef = useRef<QueuedBeacon[]>([]);
	const impressionSentRef = useRef(false);
	const completeSentRef = useRef(false);

	const slots = playlistData?.playlist || [];
	const activeSlot: SimulatorSlot | null = slots.length > 0 ? slots[activeIndex % slots.length] : null;

	const sendBeacon = useCallback(
		async (item: QueuedBeacon) => {
			if (isOffline || !navigator.onLine) {
				offlineQueueRef.current.push(item);
				dispatch(appendBeaconLog(makeLog({ event: item.event, lineItemId: item.lineItemId, lineItemName: item.lineItemName, url: item.url, statusCode: 'OFFLINE', latencyMs: 0, detail: 'Queued for online replay' })));
				return;
			}
			const { statusCode, latencyMs } = await simulatorApi.fireBeacon(item.url);
			dispatch(appendBeaconLog(makeLog({ event: item.event, lineItemId: item.lineItemId, lineItemName: item.lineItemName, url: item.url, statusCode, latencyMs })));
		},
		[dispatch, isOffline],
	);

	// Flush offline queue when reconnecting
	useEffect(() => {
		const replayOfflineQueue = async () => {
			if (isOffline || offlineQueueRef.current.length === 0) return;
			const pending = [...offlineQueueRef.current];
			offlineQueueRef.current = [];
			for (const entry of pending) {
				await sendBeacon(entry);
			}
		};
		replayOfflineQueue();
		window.addEventListener('online', replayOfflineQueue);
		return () => window.removeEventListener('online', replayOfflineQueue);
	}, [isOffline, sendBeacon]);

	// Send device heartbeat immediately when synced screen loads and every 60s while online
	useEffect(() => {
		if (!selectedScreen || selectedScreen.sync_status !== 'synced' || !selectedScreen.code || isOffline) return;

		const pingHeartbeat = async () => {
			const { statusCode, latencyMs } = await simulatorApi.sendHeartbeat(selectedScreen);
			dispatch(appendBeaconLog(makeLog({ event: 'HEARTBEAT', statusCode, latencyMs, detail: `${selectedScreen.code} → online` })));
		};

		pingHeartbeat();
		const timer = window.setInterval(pingHeartbeat, 60000);
		return () => window.clearInterval(timer);
	}, [selectedScreen, isOffline, dispatch]);

	// Reset playback position when playlist changes
	useEffect(() => {
		setActiveIndex(0);
		setRefreshCountdown(playlistData?.refresh_seconds || 120);
		if (!playlistData || playlistData.playlist.length === 0) {
			setIsPlaying(false);
			setRemainingSeconds(0);
		}
	}, [playlistData]);

	// Advance to next slot cleanly
	const nextSlot = useCallback(() => {
		if (slots.length === 0) return;
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setResolvedVast(null);
		setActiveIndex((prev) => (prev + 1) % slots.length);
	}, [slots.length]);

	const fireImpression = useCallback(() => {
		if (!activeSlot || impressionSentRef.current) return;
		impressionSentRef.current = true;
		if (activeSlot.tracking?.impression_url) {
			sendBeacon({ url: activeSlot.tracking.impression_url, event: 'IMP', lineItemId: activeSlot.line_item_id, lineItemName: activeSlot.line_item_name });
		}
		resolvedVast?.impressions?.forEach((url) => sendBeacon({ url, event: 'VAST_IMP', lineItemId: activeSlot.line_item_id, lineItemName: activeSlot.line_item_name }));
	}, [activeSlot, resolvedVast, sendBeacon]);

	const fireCompleteAndAdvance = useCallback(() => {
		if (!activeSlot) return;
		if (!completeSentRef.current) {
			completeSentRef.current = true;
			if (activeSlot.tracking?.complete_url) {
				sendBeacon({ url: activeSlot.tracking.complete_url, event: 'COMPLETE', lineItemId: activeSlot.line_item_id, lineItemName: activeSlot.line_item_name });
			}
			resolvedVast?.tracking_events?.complete?.forEach((url) => sendBeacon({ url, event: 'VAST_COMPLETE', lineItemId: activeSlot.line_item_id, lineItemName: activeSlot.line_item_name }));
		}
		nextSlot();
	}, [activeSlot, resolvedVast, sendBeacon, nextSlot]);

	const handleMediaError = useCallback(
		(reason: string) => {
			if (activeSlot) {
				dispatch(appendBeaconLog(makeLog({ event: 'SKIP', lineItemId: activeSlot.line_item_id, lineItemName: activeSlot.line_item_name, statusCode: 'ERR', latencyMs: 0, detail: reason })));
			}
			nextSlot();
		},
		[activeSlot, dispatch, nextSlot],
	);

	// Prepare active slot & resolve VAST XML when active slot changes
	useEffect(() => {
		if (!isPlaying || !activeSlot) return;
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setRemainingSeconds(activeSlot.duration || 15);
		setResolvedVast(null);

		if (activeSlot.type !== 'vast') return;
		let cancelled = false;

		simulatorApi
			.parseVast(activeSlot.media_url)
			.then((parsed) => {
				if (cancelled) return;
				if (!parsed.primary_media_url) {
					handleMediaError('Empty VAST XML (no playable MediaFile)');
					return;
				}
				setResolvedVast(parsed);
				if (parsed.duration_seconds && parsed.duration_seconds > 0) setRemainingSeconds(parsed.duration_seconds);
			})
			.catch(() => {
				if (!cancelled) handleMediaError('Failed to fetch or parse VAST XML');
			});

		return () => {
			cancelled = true;
		};
	}, [isPlaying, activeIndex, activeSlot, handleMediaError]);

	// Countdown timer (1s tick) for slot duration & auto-refresh
	useEffect(() => {
		if (!isPlaying || !activeSlot) return;
		const timer = window.setInterval(() => {
			setRemainingSeconds((prev) => {
				if (prev <= 1) {
					if (activeSlot.type === 'image' || activeSlot.type === 'html5') {
						fireCompleteAndAdvance();
					}
					return 0;
				}
				return prev - 1;
			});

			setRefreshCountdown((prev) => {
				if (prev <= 1) {
					onAutoRefresh();
					return playlistData?.refresh_seconds || 120;
				}
				return prev - 1;
			});
		}, 1000);

		return () => window.clearInterval(timer);
	}, [isPlaying, activeSlot, fireCompleteAndAdvance, onAutoRefresh, playlistData?.refresh_seconds]);

	const jumpToSlot = useCallback((idx: number) => {
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setResolvedVast(null);
		setActiveIndex(idx);
	}, []);

	return {
		isPlaying,
		setIsPlaying,
		isMuted,
		setIsMuted,
		isOffline,
		setIsOffline,
		activeIndex,
		activeSlot,
		remainingSeconds,
		refreshCountdown,
		resolvedVast,
		offlineQueuedCount: offlineQueueRef.current.length,
		fireImpression,
		fireCompleteAndAdvance,
		handleMediaError,
		nextSlot,
		jumpToSlot,
	};
};
