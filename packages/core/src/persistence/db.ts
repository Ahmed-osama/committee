import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

// Anchored to this package's own directory (not process.cwd()) so the
// default db location is stable no matter which workspace script or
// directory a command happens to be invoked from — `pnpm --filter` runs
// scripts with cwd set to the target package, not the repo root.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DB_PATH = process.env.COMMITTEE_DB_PATH ?? join(packageRoot, 'committee.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
