import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PgliteDatabase } from 'catalog-database/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { SqlClient } from '../../src/database/sql-client.js';
import { insertCatalog, type ProductFixture } from './catalog-fixture.js';

/**
 * The real application, configured as in main.ts, with PostgreSQL replaced by
 * an in-process PGlite holding the catalogue schema and the given products.
 */
export async function createTestApp(products: ProductFixture[]) {
  const db = await PgliteDatabase.createMigrated();
  await insertCatalog(db, products);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SqlClient)
    .useValue(db)
    .compile();

  const app = configureApp(
    moduleRef.createNestApplication<INestApplication<App>>(),
  );
  await app.init();
  return { app, db };
}
