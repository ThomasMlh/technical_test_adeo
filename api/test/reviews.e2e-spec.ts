import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { PgliteDatabase } from 'catalog-database/testing';
import { createTestApp } from './support/test-app.js';

describe('Reviews (e2e)', () => {
  let app: INestApplication<App>;
  let db: PgliteDatabase;

  beforeAll(async () => {
    ({ app, db } = await createTestApp([
      {
        reference: '00000001',
        reviews: [
          {
            notation: 5,
            comment: 'Very practical.',
            reviewedAt: '2025-04-06T02:09:10Z',
            author: { firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
          },
          { notation: 2, reviewedAt: '2021-01-01T00:00:00Z' },
        ],
      },
      { reference: '00000002', reviews: [{ notation: 4, reviewedAt: '2023-01-01T00:00:00Z' }] },
      { reference: '00000003' },
    ]));
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  describe('GET /reviews', () => {
    it('returns reviews most recent first, with pagination metadata', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/reviews');

      expect(status).toBe(200);
      expect(body.meta).toEqual({ page: 1, limit: 20, totalItems: 3, totalPages: 1 });
      expect(body.data[0]).toEqual({
        id: 1,
        notation: 5,
        comment: 'Very practical.',
        reviewedAt: '2025-04-06T02:09:10.000Z',
        productReference: '00000001',
        author: { id: 1, firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
      });
      expect(body.data.map((r: { id: number }) => r.id)).toEqual([1, 3, 2]);
    });

    it('returns the requested page', async () => {
      const { body } = await request(app.getHttpServer()).get('/reviews?page=2&limit=2');

      expect(body.data.map((r: { id: number }) => r.id)).toEqual([2]);
    });

    it('answers 400 to an invalid query', async () => {
      const { status } = await request(app.getHttpServer()).get('/reviews?limit=0');

      expect(status).toBe(400);
    });
  });

  describe('GET /reviews/:id', () => {
    it('returns the review', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/reviews/3');

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: 3, notation: 4, productReference: '00000002' });
    });

    it('answers 404 for an unknown id', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/reviews/999');

      expect(status).toBe(404);
      expect(body).toEqual({ statusCode: 404, error: 'Not Found', message: 'Review 999 not found' });
    });

    it('answers 400 for an id that is not a number', async () => {
      const { status } = await request(app.getHttpServer()).get('/reviews/abc');

      expect(status).toBe(400);
    });
  });

  describe('GET /products/:reference/reviews', () => {
    it('returns the reviews of that product only, most recent first', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/products/00000001/reviews');

      expect(status).toBe(200);
      expect(body.data.map((r: { id: number }) => r.id)).toEqual([1, 2]);
      expect(body.meta.totalItems).toBe(2);
    });

    it('returns an empty page for a product without reviews', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/products/00000003/reviews');

      expect(status).toBe(200);
      expect(body).toEqual({ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } });
    });

    it('answers 404 for an unknown product', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/products/99999999/reviews');

      expect(status).toBe(404);
      expect(body.message).toBe('Product 99999999 not found');
    });
  });
});
