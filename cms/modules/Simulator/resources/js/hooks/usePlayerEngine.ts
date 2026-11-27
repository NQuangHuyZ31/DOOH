import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '@core/store/hooks';
import { selectBestVastMedia, simulatorApi } from '../Action/simulatorApi';
import { appendBeaconLog } from '../store/simulatorSlice';
import type { BeaconLogEntry, ParsedVastResult, SimulatorPlaylistData, SimulatorScreenItem, SimulatorSlot } from '../types/simulator';

interface QueuedBeacon {
	url: string;
	event: 'IMP' | 'COMPLETE' | 'VAST_IMP' | 'VAST_COMPLETE';
	lineItemId?: number;
	lineItemName?: string;
}

const VIDEO_HARD_CUT_GRACE_SECONDS = 2;

const makeLog = (partial: Omit<BeaconLogEntry, 'id' | 'timestamp'>): BeaconLogEntry => ({
	id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
	...partial,
});

export const usePlayerEngine = (playlistData: SimulatorPlaylistData | null, onAutoRefresh: () => void, selectedScreen: SimulatorScreenItem | null = null) => {
	const dispatch = useAppDispatch();
	const [activePlaylist, setActivePlaylist] = useState<SimulatorPlaylistData | null>(playlistData);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(true);
	const [isOffline, setIsOffline] = useState(false);
	const [slotCursor, setSlotCursor] = useState(0);
	const [playCycle, setPlayCycle] = useState(0);
	const [remainingSeconds, setRemainingSeconds] = useState(0);
	const [refreshCountdown, setRefreshCountdown] = useState(0);
	const [resolvedVast, setResolvedVast] = useState<ParsedVastResult | null>(null);

	const activePlaylistRef = useRef<SimulatorPlaylistData | null>(activePlaylist);
	const isPlayingRef = useRef(isPlaying);
	const onAutoRefreshRef = useRef(onAutoRefresh);
	const remainingRef = useRef(0);
	const refreshRef = useRef(0);
	const pendingPlaylistRef = useRef<SimulatorPlaylistData | null>(null);
	const offlineQueueRef = useRef<QueuedBeacon[]>([]);
	const impressionSentRef = useRef(false);
	const completeSentRef = useRef(false);

	activePlaylistRef.current = activePlaylist;
	isPlayingRef.current = isPlaying;
	onAutoRefreshRef.current = onAutoRefresh;

	const slots = activePlaylist?.playlist || [];
	const activeIndex = slots.length > 0 ? slotCursor % slots.length : 0;
	const activeSlot: SimulatorSlot | null = slots.length > 0 ? slots[activeIndex] : null;

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

	// Deferred Playlist Refresh: swap immediately on screen switch / idle / empty, otherwise defer until active slot ends
	useEffect(() => {
		const nextRefresh = playlistData?.refresh_seconds || 120;
		refreshRef.current = playlistData ? nextRefresh : 0;
		setRefreshCountdown(refreshRef.current);

		const current = activePlaylistRef.current;
		const isSameScreen = Boolean(playlistData?.screen.code && current?.screen.code === playlistData.screen.code);
		const canDefer = Boolean(isSameScreen && isPlayingRef.current && current && current.playlist.length > 0 && playlistData && playlistData.playlist.length > 0);

		if (canDefer) {
			pendingPlaylistRef.current = playlistData;
			return;
		}

		pendingPlaylistRef.current = null;
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setActivePlaylist(playlistData);
		setSlotCursor(0);
		setPlayCycle((prev) => prev + 1);
		if (!playlistData || playlistData.playlist.length === 0) {
			setIsPlaying(false);
			remainingRef.current = 0;
			setRemainingSeconds(0);
		}
	}, [playlistData]);

	// Advance to next slot cleanly and apply deferred playlist if queued
	const nextSlot = useCallback(() => {
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setResolvedVast(null);

		if (pendingPlaylistRef.current) {
			const nextPlaylist = pendingPlaylistRef.current;
			pendingPlaylistRef.current = null;
			setActivePlaylist(nextPlaylist);
			setSlotCursor(0);
			setPlayCycle((prev) => prev + 1);
			return;
		}

		if (slots.length === 0) return;
		setSlotCursor((prev) => (prev + 1) % slots.length);
		setPlayCycle((prev) => prev + 1);
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
		// Never fire COMPLETE if IMP was never recorded (e.g. browser blocked autoplay in background tab)
		if (impressionSentRef.current && !completeSentRef.current) {
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

	const fireCompleteRef = useRef(fireCompleteAndAdvance);
	const handleErrorRef = useRef(handleMediaError);
	fireCompleteRef.current = fireCompleteAndAdvance;
	handleErrorRef.current = handleMediaError;

	// Initialize slot duration & resolve VAST XML when a new playCycle starts
	useEffect(() => {
		if (!isPlaying || !activeSlot) return;
		const initialDuration = activeSlot.duration || 15;
		remainingRef.current = initialDuration;
		setRemainingSeconds(initialDuration);
		setResolvedVast(null);

		if (activeSlot.type !== 'vast') return;
		let cancelled = false;

		simulatorApi
			.parseVast(activeSlot.media_url)
			.then((parsed) => {
				if (cancelled) return;
				const bestMedia = selectBestVastMedia(parsed.media_files || [], selectedScreen?.resolution_width || 1920, selectedScreen?.resolution_height || 1080);
				const resolvedUrl = bestMedia?.url || parsed.primary_media_url;
				if (!resolvedUrl) {
					handleErrorRef.current('Empty VAST XML (no playable MediaFile)');
					return;
				}
				setResolvedVast({ ...parsed, primary_media_url: resolvedUrl });
				if (parsed.duration_seconds && parsed.duration_seconds > 0) {
					remainingRef.current = parsed.duration_seconds;
					setRemainingSeconds(parsed.duration_seconds);
				}
			})
			.catch(() => {
				if (!cancelled) handleErrorRef.current('Failed to fetch or parse VAST XML');
			});

		return () => {
			cancelled = true;
		};
	}, [isPlaying, playCycle, activeSlot]);

	// Pure 1s slot countdown (paused while browser tab is hidden so autoplay throttling cannot drift slots)
	useEffect(() => {
		if (!isPlaying || !activeSlot) return;
		const isTimedMedia = activeSlot.type === 'image' || activeSlot.type === 'html5';
		const timer = window.setInterval(() => {
			if (document.hidden) return;
			remainingRef.current -= 1;
			if (isTimedMedia && remainingRef.current <= 0) {
				setRemainingSeconds(0);
				fireCompleteRef.current();
				return;
			}
			if (!isTimedMedia && remainingRef.current <= -VIDEO_HARD_CUT_GRACE_SECONDS) {
				setRemainingSeconds(0);
				fireCompleteRef.current();
				return;
			}
			setRemainingSeconds(Math.max(0, remainingRef.current));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [isPlaying, playCycle, activeSlot]);

	// Independent playlist auto-refresh timer (runs only after initial playlist loaded)
	useEffect(() => {
		if (!selectedScreen || selectedScreen.sync_status !== 'synced' || isOffline || !playlistData) return;
		const resetSeconds = playlistData.refresh_seconds || 120;
		const timer = window.setInterval(() => {
			if (refreshRef.current <= 1) {
				refreshRef.current = resetSeconds;
				setRefreshCountdown(resetSeconds);
				onAutoRefreshRef.current();
				return;
			}
			refreshRef.current -= 1;
			setRefreshCountdown(refreshRef.current);
		}, 1000);

		return () => window.clearInterval(timer);
	}, [selectedScreen, isOffline, playlistData]);

	const jumpToSlot = useCallback((idx: number) => {
		impressionSentRef.current = false;
		completeSentRef.current = false;
		setResolvedVast(null);
		setSlotCursor(idx);
		setPlayCycle((prev) => prev + 1);
	}, []);

	return {
		isPlaying,
		setIsPlaying,
		isMuted,
		setIsMuted,
		isOffline,
		setIsOffline,
		activeIndex,
		playCycle,
		activeSlot,
		resolvedVast,
		remainingSeconds: Math.max(0, remainingSeconds),
		refreshCountdown,
		offlineQueuedCount: offlineQueueRef.current.length,
		fireImpression,
		fireCompleteAndAdvance,
		handleMediaError,
		nextSlot,
		jumpToSlot,
	};
};
