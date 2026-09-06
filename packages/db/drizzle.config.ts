import { defineConfig } from 'drizzle-kit';

const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
if (!unpooledUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is required (drizzle-kit needs a direct, non-pgbouncer connection)');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: unpooledUrl,
  },
});
