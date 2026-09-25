import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  // Each feature owns its tables in `db/*.schema.ts`; core owns shared tables.
  schema: ['./src/core/db/*.schema.ts', './src/features/*/db/*.schema.ts'],
  out: './src/core/db/migrations',
});
