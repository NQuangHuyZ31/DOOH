import { MongoClient, type Db } from 'mongodb';
import { config } from '../src/modules/Core/config/config.js';

let clientInstance: MongoClient | null = null;
let dbInstance: Db | null = null;

export const getMongoClient = async (): Promise<MongoClient> => {
	if (!clientInstance) {
		clientInstance = new MongoClient(config.mongodb.uri, {
			maxPoolSize: 50,
			minPoolSize: 5,
			serverSelectionTimeoutMS: 3000,
		});
		await clientInstance.connect();
	}
	return clientInstance;
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
