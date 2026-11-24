import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { PgliteDatabase } from 'catalog-database/testing';
import { createTestApp } from './support/test-app.js';

describe('API documentation (e2e)', () => {
  let app: INestApplication<App>;
  let db: PgliteDatabase;

  beforeAll(async () => {
    ({ app, db } = await createTestApp([]));
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it('serves the OpenAPI document, describing every route', async () => {
    const { status, body } = await request(app.getHttpServer()).get('/docs-json');

    expect(status).toBe(200);
    expect(body.info.title).toBe('Product catalogue API');
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining([
        '/products',
        '/products/most-appreciated',
        '/products/lowest-rated',
        '/products/{reference}',
        '/products/{reference}/reviews',
        '/reviews',
        '/reviews/{id}',
      ]),
    );
  });

  it('serves the interactive documentation page', async () => {
    const { status, type } = await request(app.getHttpServer()).get('/docs');

    expect(status).toBe(200);
    expect(type).toBe('text/html');
  });
});
