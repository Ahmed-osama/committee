import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { migrate as migrateHttp } from 'drizzle-orm/neon-http/migrator';
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePostgres } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Runs against DATABASE_URL_UNPOOLED, never DATABASE_URL: drizzle's migration
// locking needs a direct connection, and a pgbouncer pooled one breaks it.
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
if (!unpooledUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is required to run migrations');
}

// See client.ts's isLocalPostgres comment: Neon's HTTP driver can't reach a
// plain local Postgres, so a localhost URL migrates via node-postgres instead.
const isLocalPostgres = /^postgres(?:ql)?:\/\/[^/@]*@?(localhost|127\.0\.0\.1)[:/]/.test(
  unpooledUrl,
);

if (isLocalPostgres) {
  const pool = new Pool({ connectionString: unpooledUrl });
  await migrateNodePostgres(drizzleNodePostgres(pool), { migrationsFolder: './migrations' });
  await pool.end();
} else {
  await migrateHttp(drizzleHttp(neon(unpooledUrl)), { migrationsFolder: './migrations' });
}
