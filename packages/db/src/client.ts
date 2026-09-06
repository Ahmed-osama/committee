import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema.js';

// neonConfig.webSocketConstructor: the neon-serverless Pool below needs a
// WebSocket implementation to open its TCP-over-WS connection from Node.
neonConfig.webSocketConstructor = ws;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

// Default client for normal reads/writes: one query per HTTP round trip,
// safe to use over Neon's pooled (pgbouncer) connection string.
//
// neon-http has no multi-statement transactions — `db.transaction(...)` will
// throw. Anything issuing more than one statement that must commit/roll back
// together (e.g. COM-18's KYC writes) needs to either accept non-transactional
// writes or use `pooledClient` below instead.
export const db = drizzleHttp(neon(requireEnv('DATABASE_URL')), { schema });

// Transactional client, kept for write paths that need to hold a lock across
// statements (SELECT ... FOR UPDATE) — e.g. COM-20's dual-confirmed deal
// closure and offer state transitions. Requires the pooled connection string:
// neon-serverless opens a real TCP/WebSocket session per checkout, which is
// what pgbouncer's transaction-pooling mode is for.
const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });
export const pooledDb = drizzlePool(pool, { schema });
