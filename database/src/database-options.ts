import type { DataSourceOptions } from 'typeorm';
import { catalogMigrations } from './migrations/index.js';

/** Matches the `postgres` service of docker-compose.yml at the repository root. */
export const DEFAULT_DATABASE_URL = 'postgres://catalog:catalog@localhost:5432/catalog';

export const databaseOptions = (
  databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  migrations: catalogMigrations,
  migrationsTableName: 'migrations',
  // The schema is owned by migrations only, never derived from entities.
  synchronize: false,
});
