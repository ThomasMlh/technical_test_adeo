import { PgliteDatabase } from 'catalog-database/testing';
import { insertCatalog } from '../../test/support/catalog-fixture.js';
import { PostgresReviewsRepository } from './postgres-reviews.repository.js';

const poha = { firstName: 'Poha', lastName: 'Kuxero', type: 'professional' } as const;

describe('PostgresReviewsRepository', () => {
  let db: PgliteDatabase;
  let repository: PostgresReviewsRepository;

  beforeAll(async () => {
    db = await PgliteDatabase.createMigrated();
    repository = new PostgresReviewsRepository(db);
  });

  afterAll(() => db.close());

  beforeEach(() => db.query('TRUNCATE reviews, authors, products RESTART IDENTITY'));

  describe('findPage', () => {
    it('lists reviews most recent first, with their product reference and author', async () => {
      await insertCatalog(db, [
        {
          reference: '00000001',
          reviews: [
            { notation: 2, comment: 'Old', reviewedAt: '2020-01-01T07:47:06Z', author: poha },
            { notation: 5, comment: 'Recent', reviewedAt: '2025-04-06T02:09:10Z', author: poha },
          ],
        },
      ]);

      const { items, totalItems } = await repository.findPage({ page: 1, limit: 10 });

      expect(totalItems).toBe(2);
      expect(items).toEqual([
        {
          id: 2,
          notation: 5,
          comment: 'Recent',
          reviewedAt: new Date('2025-04-06T02:09:10Z'),
          productReference: '00000001',
          author: { id: 1, firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
        },
        expect.objectContaining({ id: 1, comment: 'Old' }),
      ]);
    });

    it('orders reviews of the same date by id, so pages never overlap', async () => {
      await insertCatalog(db, [{ reference: '00000001', notations: [1, 2, 3] }]);

      const { items } = await repository.findPage({ page: 1, limit: 10 });

      expect(items.map((r) => r.id)).toEqual([3, 2, 1]);
    });

    it('returns only the requested page, and the total of all reviews', async () => {
      await insertCatalog(db, [{ reference: '00000001', notations: [1, 2, 3] }]);

      const { items, totalItems } = await repository.findPage({ page: 2, limit: 2 });

      expect(items.map((r) => r.id)).toEqual([1]);
      expect(totalItems).toBe(3);
    });
  });

  describe('findById', () => {
    it('returns the review', async () => {
      await insertCatalog(db, [{ reference: '00000001', notations: [4] }]);

      expect(await repository.findById(1)).toMatchObject({
        id: 1,
        notation: 4,
        productReference: '00000001',
      });
    });

    it('returns null for an unknown id', async () => {
      expect(await repository.findById(999)).toBeNull();
    });
  });

  describe('findPageOfProduct', () => {
    it('returns only the reviews of that product', async () => {
      await insertCatalog(db, [
        { reference: '00000001', notations: [5, 4] },
        { reference: '00000002', notations: [1] },
      ]);

      const slice = await repository.findPageOfProduct('00000001', { page: 1, limit: 10 });

      expect(slice?.totalItems).toBe(2);
      expect(slice?.items.map((r) => r.productReference)).toEqual(['00000001', '00000001']);
    });

    it('paginates the reviews of the product', async () => {
      await insertCatalog(db, [{ reference: '00000001', notations: [5, 4, 3] }]);

      const slice = await repository.findPageOfProduct('00000001', { page: 1, limit: 2 });

      expect(slice).toEqual({ items: [expect.any(Object), expect.any(Object)], totalItems: 3 });
    });

    it('returns an empty slice for a product without reviews', async () => {
      await insertCatalog(db, [{ reference: '00000001' }]);

      expect(await repository.findPageOfProduct('00000001', { page: 1, limit: 10 })).toEqual({
        items: [],
        totalItems: 0,
      });
    });

    it('returns null for an unknown product', async () => {
      expect(await repository.findPageOfProduct('99999999', { page: 1, limit: 10 })).toBeNull();
    });
  });

  describe('findPageOfAuthor', () => {
    it('returns only the reviews of that author, most recent first', async () => {
      await insertCatalog(db, [
        { reference: '00000001', reviews: [{ notation: 5, reviewedAt: '2021-01-01T00:00:00Z', author: poha }] },
        { reference: '00000002', reviews: [{ notation: 2, reviewedAt: '2024-01-01T00:00:00Z', author: poha }] },
        { reference: '00000003', notations: [1] },
      ]);

      const slice = await repository.findPageOfAuthor(1, { page: 1, limit: 10 });

      expect(slice?.totalItems).toBe(2);
      expect(slice?.items.map((r) => r.productReference)).toEqual(['00000002', '00000001']);
    });

    it('returns null for an unknown author', async () => {
      expect(await repository.findPageOfAuthor(999, { page: 1, limit: 10 })).toBeNull();
    });
  });
});
