import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { PgliteDatabase } from 'catalog-database/testing';
import { createTestApp } from './support/test-app.js';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let db: PgliteDatabase;

  beforeAll(async () => {
    ({ app, db } = await createTestApp([
      {
        reference: '00000001',
        name: 'Drill',
        description: 'A drill',
        price: 972.5,
        notations: [5, 4, 4],
      },
      { reference: '00000002', name: 'Hammer', notations: [1, 2] },
      { reference: '00000003', name: 'Saw', notations: [5] },
      { reference: '00000004', name: 'Wrench' },
    ]));
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  describe('GET /products', () => {
    it('returns the first page of 20 products by default, with pagination metadata', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/products',
      );

      expect(status).toBe(200);
      expect(body.meta).toEqual({
        page: 1,
        limit: 20,
        totalItems: 4,
        totalPages: 1,
      });
      expect(body.data[0]).toEqual({
        reference: '00000001',
        name: 'Drill',
        price: 972.5,
        currency: 'EUR',
        stock: 1,
        reviewCount: 3,
        averageRating: 4.33,
      });
    });

    it('does not send the description in the list', async () => {
      const { body } = await request(app.getHttpServer()).get('/products');

      expect(body.data[0]).not.toHaveProperty('description');
    });

    it('returns the requested page', async () => {
      const { body } = await request(app.getHttpServer()).get(
        '/products?page=2&limit=3',
      );

      expect(body.data.map((p: { name: string }) => p.name)).toEqual([
        'Wrench',
      ]);
      expect(body.meta).toEqual({
        page: 2,
        limit: 3,
        totalItems: 4,
        totalPages: 2,
      });
    });

    it.each([
      'page=0',
      'limit=0',
      'limit=101',
      'limit=abc',
      'page=1.5',
      'unknown=1',
    ])('answers 400 to an invalid query (%s)', async (query) => {
      const { status, body } = await request(app.getHttpServer()).get(
        `/products?${query}`,
      );

      expect(status).toBe(400);
      expect(body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    });
  });

  describe('GET /products/:reference', () => {
    it('returns the product with its description', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/products/00000001',
      );

      expect(status).toBe(200);
      expect(body).toMatchObject({
        reference: '00000001',
        description: 'A drill',
      });
    });

    it('answers 404 for an unknown reference', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/products/99999999',
      );

      expect(status).toBe(404);
      expect(body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Product 99999999 not found',
      });
    });
  });

  describe('GET /products/most-appreciated', () => {
    it('ranks products by their number of positive reviews (notation > 3)', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/products/most-appreciated',
      );

      expect(status).toBe(200);
      expect(
        body.map((p: { reference: string; positiveReviewCount: number }) => [
          p.reference,
          p.positiveReviewCount,
        ]),
      ).toEqual([
        ['00000001', 3],
        ['00000003', 1],
      ]);
    });

    it('accepts a limit', async () => {
      const { body } = await request(app.getHttpServer()).get(
        '/products/most-appreciated?limit=1',
      );

      expect(body).toHaveLength(1);
    });

    it('answers 400 to a limit above 50', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/products/most-appreciated?limit=51',
      );

      expect(status).toBe(400);
    });
  });

  describe('GET /products/lowest-rated', () => {
    it('lists products whose average rating is below 3', async () => {
      const { status, body } = await request(app.getHttpServer()).get(
        '/products/lowest-rated',
      );

      expect(status).toBe(200);
      expect(body).toEqual([
        expect.objectContaining({ reference: '00000002', averageRating: 1.5 }),
      ]);
    });
  });
});
