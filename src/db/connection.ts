import { MongoClient, Db } from 'mongodb';
import config from '../config';

let db: Db | null = null;
let client: MongoClient | null = null;

/**
 * Подключение к базе данных MongoDB
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) return db;
  
  try {
    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    db = client.db(config.mongodb.dbName);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Получение экземпляра базы данных
 */
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Закрытие соединения с базой данных
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}