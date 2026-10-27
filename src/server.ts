import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? 'data/app.db';

if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });

const app = buildApp({ dbPath, logger: true });
await app.listen({ port, host: '0.0.0.0' });
