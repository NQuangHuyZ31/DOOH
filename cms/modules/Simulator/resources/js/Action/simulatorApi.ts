import { http } from '@core/Action/api';
import type { ParsedVastResult, SimulatorDeviceConfig, SimulatorPlaylistData } from '../types/simulator';

interface ApiEnvelope<T> {
	status: string;
	message: string;
	data: T;
}

export const simulatorApi = {
	syncDevice: async (screenId: number): Promise<SimulatorDeviceConfig> => {
		const res = await http.get<ApiEnvelope<SimulatorDeviceConfig>>('/simulator/sync-device', { params: { screen_id: screenId } });
		return res.data.data;
	},

	// Direct Edge Player call to Node Delivery API using provisioned X-DOOH-SCREEN-KEY
	fetchNodePlaylist: async (device: SimulatorDeviceConfig): Promise<{ data: SimulatorPlaylistData; statusCode: number; latencyMs: number }> => {
		const url = `${device.node_api_url.replace(/\/+$/, '')}/delivery/playlist?screen_code=${encodeURIComponent(device.screen.code)}`;
		const started = performance.now();
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'X-DOOH-SCREEN-KEY': device.screen.secret_key || '',
			},
		});
		const latencyMs = Math.round(performance.now() - started);
		const json = (await res.json()) as ApiEnvelope<Omit<SimulatorPlaylistData, 'source' | 'screen'>>;
		if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `Node Delivery API error (HTTP ${res.status})`);
		}

		return {
			statusCode: res.status,
			latencyMs,
			data: { ...json.data, source: 'node_api', screen: device.screen },
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
