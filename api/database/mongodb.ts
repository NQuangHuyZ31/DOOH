import dns from 'node:dns';
import { MongoClient, type Db } from 'mongodb';
import { config } from '@core/config/config.js';

let clientInstance: MongoClient | null = null;
let dbInstance: Db | null = null;
let dnsFallbackApplied = false;

const connectClient = async (): Promise<MongoClient> => {
	const client = new MongoClient(config.mongodb.uri, {
		maxPoolSize: 50,
		minPoolSize: 5,
		serverSelectionTimeoutMS: 3000,
	});
	try {
		await client.connect();
		return client;
	} catch (err: unknown) {
		await client.close().catch(() => {});
		throw err;
	}
};

export const getMongoClient = async (): Promise<MongoClient> => {
	if (clientInstance) return clientInstance;
	if (!config.mongodb.uri) throw new Error('MONGODB_URI is not configured');

	try {
		clientInstance = await connectClient();
		return clientInstance;
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : '';
		// Auto-fallback to public DNS when Windows/ISP local DNS refuses SRV lookups for mongodb+srv://
		if (!dnsFallbackApplied && config.mongodb.uri.startsWith('mongodb+srv://') && /querySrv|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
			dnsFallbackApplied = true;
			dns.setServers(['1.1.1.1', '8.8.8.8']);
			clientInstance = await connectClient();
			return clientInstance;
		}
		throw err;
	}
};

export const getMongoDb = async (): Promise<Db> => {
	if (!dbInstance) {
		const client = await getMongoClient();
		dbInstance = client.db(config.mongodb.dbName);
	}
	return dbInstance;
};

export const checkMongoHealth = async (): Promise<boolean> => {
	try {
		const db = await getMongoDb();
		const res = await db.command({ ping: 1 });
		return res.ok === 1;
	} catch {
		return false;
	}
};

export const closeMongoConnection = async (): Promise<void> => {
	if (clientInstance) {
		await clientInstance.close();
		clientInstance = null;
		dbInstance = null;
	}
};
