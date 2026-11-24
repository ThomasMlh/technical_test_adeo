import { DataSource } from 'typeorm';
import { databaseOptions } from './database-options.js';

/**
 * `pnpm migrate`: applies the migrations not applied yet, each in its own
 * transaction, and does nothing when the schema is up to date. Unlike the
 * TypeORM CLI, it does not print every SQL statement.
 */
const dataSource = await new DataSource(databaseOptions()).initialize();
try {
  const applied = await dataSource.runMigrations({ transaction: 'each' });
  console.log(
    applied.length > 0
      ? `Applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(', ')}`
      : 'Schema up to date: no pending migration',
  );
} finally {
  await dataSource.destroy();
}
