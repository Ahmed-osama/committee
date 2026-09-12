import { neon, neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { Pool as NodePgPool } from 'pg';
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

// Neon's serverless drivers (both neon-http and neon-serverless/Pool) always
// speak to a Neon-specific SQL-over-HTTP/WS endpoint, not raw Postgres wire
// protocol — pointing either one at a plain local Postgres (no Neon proxy in
// front of it) fails with ECONNREFUSED on :443. `apps/web/README.md`'s "local
// dev without Neon reachability" fallback needs a real wire-protocol driver
// instead, so a `localhost`/`127.0.0.1` connection string routes through
// `pg`/`drizzle-orm/node-postgres` here. Never do this switch based on
// NODE_ENV — a Neon dev/preview branch is still a Neon host in every
// environment, this is purely about what's on the other end of the URL.
const isLocalPostgres = (url: string) =>
  /^postgres(?:ql)?:\/\/[^/@]*@?(localhost|127\.0\.0\.1)[:/]/.test(url);

const databaseUrl = requireEnv('DATABASE_URL');

// Default client for normal reads/writes. Against Neon, this is neon-http:
// one query per HTTP round trip, safe over the pooled (pgbouncer) connection
// string, but with no multi-statement transactions (`db.transaction(...)`
// throws) — anything needing that (e.g. COM-18's KYC writes) must use
// `pooledDb` below instead. Against local Postgres, node-postgres's Pool
// supports transactions natively, so this restriction doesn't apply there,
// but code should still use `pooledDb` for transactional writes to stay
// correct against a real Neon deployment.
export const db = isLocalPostgres(databaseUrl)
  ? drizzleNodePostgres(new NodePgPool({ connectionString: databaseUrl }), { schema })
  : drizzleHttp(neon(databaseUrl), { schema });

// Transactional client, kept for write paths that need to hold a lock across
// statements (SELECT ... FOR UPDATE) — e.g. COM-20's dual-confirmed deal
// closure and offer state transitions. Against Neon this requires the pooled
// connection string: neon-serverless opens a real TCP/WebSocket session per
// checkout, which is what pgbouncer's transaction-pooling mode is for.
export const pooledDb = isLocalPostgres(databaseUrl)
  ? drizzleNodePostgres(new NodePgPool({ connectionString: databaseUrl }), { schema })
  : drizzlePool(new NeonPool({ connectionString: databaseUrl }), { schema });
