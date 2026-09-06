import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// Runs against DATABASE_URL_UNPOOLED, never DATABASE_URL: drizzle's migration
// locking needs a direct connection, and a pgbouncer pooled one breaks it.
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
if (!unpooledUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is required to run migrations');
}

const db = drizzle(neon(unpooledUrl));

await migrate(db, { migrationsFolder: './migrations' });
