import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { PgliteDatabase } from 'catalog-database/testing';
import { createTestApp } from './support/test-app.js';

const bob = { firstName: 'Bob', lastName: 'Lima', type: 'amateur' } as const;
const ana = { firstName: 'Ana', lastName: 'Lima', type: 'professional' } as const;
const zola = { firstName: 'Zola', lastName: 'Abara', type: 'amateur' } as const;

describe('Authors (e2e)', () => {
  let app: INestApplication<App>;
  let db: PgliteDatabase;

  beforeAll(async () => {
    ({ app, db } = await createTestApp([
      {
        reference: '00000001',
        reviews: [
          { notation: 5, reviewedAt: '2021-01-01T00:00:00Z', author: bob },
          { notation: 4, author: ana },
        ],
      },
      {
        reference: '00000002',
        reviews: [
          { notation: 3, reviewedAt: '2024-01-01T00:00:00Z', author: bob },
          { notation: 1, author: zola },
        ],
      },
    ]));
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  describe('GET /authors', () => {
    it('returns authors sorted by name, with their review count and pagination metadata', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/authors');

      expect(status).toBe(200);
      expect(body).toEqual({
        data: [
          { id: 3, firstName: 'Zola', lastName: 'Abara', type: 'amateur', reviewCount: 1 },
          { id: 2, firstName: 'Ana', lastName: 'Lima', type: 'professional', reviewCount: 1 },
          { id: 1, firstName: 'Bob', lastName: 'Lima', type: 'amateur', reviewCount: 2 },
        ],
        meta: { page: 1, limit: 20, totalItems: 3, totalPages: 1 },
      });
    });

    it('filters on the author type', async () => {
      const { body } = await request(app.getHttpServer()).get('/authors?type=professional');

      expect(body.data.map((a: { firstName: string }) => a.firstName)).toEqual(['Ana']);
      expect(body.meta.totalItems).toBe(1);
    });

    it('returns the requested page', async () => {
      const { body } = await request(app.getHttpServer()).get('/authors?page=2&limit=2');

      expect(body.data.map((a: { firstName: string }) => a.firstName)).toEqual(['Bob']);
    });

    it.each(['type=robot', 'limit=0'])('answers 400 to an invalid query (%s)', async (query) => {
      const { status } = await request(app.getHttpServer()).get(`/authors?${query}`);

      expect(status).toBe(400);
    });
  });

  describe('GET /authors/:id', () => {
    it('returns the author', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/authors/1');

      expect(status).toBe(200);
      expect(body).toEqual({ id: 1, firstName: 'Bob', lastName: 'Lima', type: 'amateur', reviewCount: 2 });
    });

    it('answers 404 for an unknown id', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/authors/999');

      expect(status).toBe(404);
      expect(body.message).toBe('Author 999 not found');
    });

    it('answers 400 for an id that is not a number', async () => {
      const { status } = await request(app.getHttpServer()).get('/authors/abc');

      expect(status).toBe(400);
    });
  });

  describe('GET /authors/:id/reviews', () => {
    it('returns the reviews of that author, most recent first', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/authors/1/reviews');

      expect(status).toBe(200);
      expect(body.data.map((r: { productReference: string }) => r.productReference)).toEqual([
        '00000002',
        '00000001',
      ]);
      expect(body.meta.totalItems).toBe(2);
    });

    it('answers 404 for an unknown author', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/authors/999/reviews');

      expect(status).toBe(404);
      expect(body.message).toBe('Author 999 not found');
    });
  });
});
