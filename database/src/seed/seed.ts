import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../database-options.js';
import { TypeOrmSqlClient } from '../typeorm-sql-client.js';
import { normalizeCatalog } from './normalize-catalog.js';
import { PostgresCatalogWriter } from './postgres-catalog-writer.js';
import type { SourceProduct } from './source-catalog.js';

/**
 * `pnpm seed`: loads data/products.json into the database.
 * Composition root only: reading, normalizing and writing live in their own units.
 */
const catalogFile =
  process.env.CATALOG_FILE ??
  resolve(import.meta.dirname, '../../../data/products.json');

const dataSource = await new DataSource(databaseOptions()).initialize();
try {
  const source = JSON.parse(
    await readFile(catalogFile, 'utf8'),
  ) as SourceProduct[];
  const catalog = normalizeCatalog(source);

  await new PostgresCatalogWriter(
    new TypeOrmSqlClient(dataSource),
  ).replaceCatalog(catalog);

  console.log(
    `Seeded ${catalog.products.length} products, ${catalog.authors.length} authors, ` +
      `${catalog.reviews.length} reviews from ${catalogFile}`,
  );
} finally {
  await dataSource.destroy();
}
