import { http } from '@core/Action/api';
import type { BatchSyncFailedItem, BatchSyncResult, CreateLocalScreenPayload, ParsedVastResult, SimulatorPlaylistData, SimulatorScreenItem, SimulatorScreenMeta } from '../types/simulator';

interface ApiEnvelope<T> {
	status: string;
	message: string;
	data: T;
}

interface NodeBatchResponse {
	total: number;
	created_count: number;
	failed_count: number;
	created: Array<{ index: number; code: string; secret_key: string }>;
	failed: BatchSyncFailedItem[];
}

const buildPartnerPayload = (s: SimulatorScreenItem): Record<string, unknown> => ({
	name: s.name,
	location_name: s.location_name,
	city: s.city,
	...(s.sub_location ? { sub_location: s.sub_location } : {}),
	screen_type: s.screen_type,
	resolution_width: s.resolution_width,
	resolution_height: s.resolution_height,
	has_audio: s.has_audio,
	loop_duration_seconds: s.loop_duration_seconds,
	default_slot_seconds: s.default_slot_seconds,
	...(s.hardware_device_uid ? { hardware_device_uid: s.hardware_device_uid } : {}),
});

export const toScreenMeta = (s: SimulatorScreenItem): SimulatorScreenMeta => ({
	id: s.id,
	code: s.code || '',
	name: s.name,
	secret_key: s.secret_key || undefined,
	resolution_width: s.resolution_width,
	resolution_height: s.resolution_height,
	orientation: s.orientation,
	aspect_ratio: s.aspect_ratio || '16:9',
	has_audio: s.has_audio,
	loop_duration_seconds: s.loop_duration_seconds,
	default_slot_seconds: s.default_slot_seconds,
	status: 'active',
});

export const simulatorApi = {
	listScreens: async (): Promise<SimulatorScreenItem[]> => {
		const res = await http.get<ApiEnvelope<SimulatorScreenItem[]>>('/simulator/screen', { params: { per_page: 100 } });
		return res.data.data || [];
	},

	createLocalScreen: async (payload: CreateLocalScreenPayload): Promise<SimulatorScreenItem> => {
		const res = await http.post<ApiEnvelope<SimulatorScreenItem>>('/simulator/screen', payload);
		return res.data.data;
	},

	// Direct Partner S2S call to Node Venue API (avoids single-threaded PHP server deadlock)
	syncScreenToCms: async (screen: SimulatorScreenItem, partnerApiKey: string): Promise<SimulatorScreenItem> => {
		const nodeUrl = `${screen.node_api_url.replace(/\/+$/, '')}/venue/screens`;
		const nodeRes = await fetch(nodeUrl, {
			method: 'POST',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-DOOH-API-KEY': partnerApiKey },
			body: JSON.stringify(buildPartnerPayload(screen)),
		});
		const nodeJson = (await nodeRes.json()) as ApiEnvelope<{ code: string; secret_key: string }>;
		if (!nodeRes.ok || nodeJson.status !== 'success' || !nodeJson.data?.code) {
			throw new Error(nodeJson.message || `Node Venue API error (HTTP ${nodeRes.status})`);
		}

		const saved = await http.post<ApiEnvelope<SimulatorScreenItem>>(`/simulator/screen/${screen.id}/sync`, {
			code: nodeJson.data.code,
			secret_key: nodeJson.data.secret_key,
		});
		return saved.data.data;
	},

	batchSyncScreensToCms: async (screens: SimulatorScreenItem[], partnerApiKey: string): Promise<BatchSyncResult> => {
		const nodeUrl = `${screens[0].node_api_url.replace(/\/+$/, '')}/venue/screens/batch`;
		const nodeRes = await fetch(nodeUrl, {
			method: 'POST',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-DOOH-API-KEY': partnerApiKey },
			body: JSON.stringify({ screens: screens.map(buildPartnerPayload) }),
		});
		const nodeJson = (await nodeRes.json()) as ApiEnvelope<NodeBatchResponse>;
		if (!nodeRes.ok || nodeJson.status !== 'success' || !nodeJson.data) {
			throw new Error(nodeJson.message || `Node Venue Batch API error (HTTP ${nodeRes.status})`);
		}

		const itemsToSave = (nodeJson.data.created || [])
			.map((entry) => {
				const target = screens[entry.index];
				return target && entry.code ? { id: target.id, code: entry.code, secret_key: entry.secret_key } : null;
			})
			.filter((x): x is { id: number; code: string; secret_key: string } => x !== null);

		const synced = itemsToSave.length > 0 ? (await http.post<ApiEnvelope<SimulatorScreenItem[]>>('/simulator/screen/batch-sync', { items: itemsToSave })).data.data : [];

		return {
			total: nodeJson.data.total,
			synced_count: synced.length,
			failed_count: nodeJson.data.failed_count,
			synced,
			failed: nodeJson.data.failed || [],
		};
	},

	deleteLocalScreen: async (id: number): Promise<void> => {
		await http.delete(`/simulator/screen/${id}`);
	},

	// Direct Edge Player call to Node Delivery API using synced X-DOOH-SCREEN-KEY
	fetchNodePlaylist: async (screen: SimulatorScreenItem): Promise<{ data: SimulatorPlaylistData; statusCode: number; latencyMs: number }> => {
		const code = screen.code || '';
		const url = `${screen.node_api_url.replace(/\/+$/, '')}/delivery/playlist?screen_code=${encodeURIComponent(code)}`;
		const started = performance.now();
		const res = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json', 'X-DOOH-SCREEN-KEY': screen.secret_key || '' },
		});
		const latencyMs = Math.round(performance.now() - started);
		const json = (await res.json()) as ApiEnvelope<Omit<SimulatorPlaylistData, 'source' | 'screen'>>;
		if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `Node Delivery API error (HTTP ${res.status})`);
		}

		return {
			statusCode: res.status,
			latencyMs,
			data: { ...json.data, source: 'node_api', screen: toScreenMeta(screen) },
		};
	},

	parseVast: async (url: string): Promise<ParsedVastResult> => {
		const res = await http.post<ApiEnvelope<ParsedVastResult>>('/simulator/parse-vast', { url });
		return res.data.data;
	},

	fireBeacon: async (url: string): Promise<{ statusCode: number | 'ERR'; latencyMs: number }> => {
		const started = performance.now();
		try {
			const res = await fetch(url, { method: 'GET', keepalive: true });
			return { statusCode: res.status, latencyMs: Math.round(performance.now() - started) };
		} catch {
			return { statusCode: 'ERR', latencyMs: Math.round(performance.now() - started) };
		}
	},
};
