import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/config.js';
import { closeRedisConnection } from './database/redis.js';
import { closeMongoConnection } from './database/mongodb.js';

const app = createApp();
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
