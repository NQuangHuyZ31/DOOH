import http from 'node:http';
import { coreRouter, createApp } from './app.js';
import { assertProductionConfig, config } from './config/config.js';
import { closeRedisConnection, closeMongoConnection } from '@database';
import { createAuthGuard } from '@modules/Auth/index.js';
import { createDeliveryRouter } from '@modules/Delivery/index.js';

assertProductionConfig();
coreRouter.mount(`${config.apiPrefix}/delivery`, createDeliveryRouter());

const app = createApp(coreRouter, [createAuthGuard()]);
const server = http.createServer(app);

server.listen(config.port, () => {
	console.log(`[DOOH Tracking API Core] Listening on port ${config.port} (${config.nodeEnv})`);
});

const handleShutdown = async (signal: string) => {
	console.log(`[DOOH Tracking API Core] Received ${signal}. Closing gracefully...`);
	server.close(async () => {
		await closeRedisConnection();
		await closeMongoConnection();
		console.log('[DOOH Tracking API Core] Closed remaining connections and pools.');
		process.exit(0);
	});

	setTimeout(() => {
		console.error('[DOOH Tracking API Core] Force shutdown after 10s timeout');
		process.exit(1);
	}, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
