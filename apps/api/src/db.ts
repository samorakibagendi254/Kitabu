import { Pool } from 'pg';
import Redis from 'ioredis';
import { appConfig } from './config.js';

export const db = new Pool({
  connectionString: appConfig.KITABU_DATABASE_URL
});

export const redis = new Redis(appConfig.KITABU_REDIS_URL, {
  maxRetriesPerRequest: 2
});
