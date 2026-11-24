import { PgliteDatabase } from 'catalog-database/testing';
import { insertCatalog } from '../../test/support/catalog-fixture.js';
import { PostgresProductsRepository } from './postgres-products.repository.js';

describe('PostgresProductsRepository', () => {
  let db: PgliteDatabase;
  let repository: PostgresProductsRepository;

  beforeAll(async () => {
    db = await PgliteDatabase.createMigrated();
    repository = new PostgresProductsRepository(db);
  });

  afterAll(() => db.close());

  beforeEach(() => db.query('TRUNCATE reviews, authors, products RESTART IDENTITY'));

  describe('findPage', () => {
    it('lists products by name, with their review count and average rating', async () => {
      await insertCatalog(db, [
        { reference: '00000002', name: 'Saw', price: 13.06, stock: 3, notations: [5, 4, 4] },
        { reference: '00000001', name: 'Drill', price: 972.5, stock: 415, notations: [1] },
      ]);

      const { items, totalItems } = await repository.findPage({ page: 1, limit: 10 });

      expect(totalItems).toBe(2);
      expect(items).toEqual([
        { reference: '00000001', name: 'Drill', price: 972.5, currency: 'EUR', stock: 415, reviewCount: 1, averageRating: 1 },
        { reference: '00000002', name: 'Saw', price: 13.06, currency: 'EUR', stock: 3, reviewCount: 3, averageRating: 4.33 },
      ]);
    });

    it('gives a product without reviews a count of 0 and no average', async () => {
      await insertCatalog(db, [{ reference: '00000001' }]);

      const { items } = await repository.findPage({ page: 1, limit: 10 });

      expect(items[0]).toMatchObject({ reviewCount: 0, averageRating: null });
    });

    it('returns only the requested page, and the total of all products', async () => {
      await insertCatalog(db, [
        { reference: '00000001', name: 'A' },
        { reference: '00000002', name: 'B' },
        { reference: '00000003', name: 'C' },
      ]);

      const { items, totalItems } = await repository.findPage({ page: 2, limit: 2 });

      expect(items.map((p) => p.name)).toEqual(['C']);
      expect(totalItems).toBe(3);
    });
  });

  describe('findByReference', () => {
    it('returns the product with its description', async () => {
      await insertCatalog(db, [
        { reference: '00000001', name: 'Drill', description: 'A drill', notations: [4, 5] },
      ]);

      expect(await repository.findByReference('00000001')).toEqual({
        reference: '00000001',
        name: 'Drill',
        description: 'A drill',
        price: 10,
        currency: 'EUR',
        stock: 1,
        reviewCount: 2,
        averageRating: 4.5,
      });
    });

    it('returns null for an unknown reference', async () => {
      expect(await repository.findByReference('99999999')).toBeNull();
    });
  });

  describe('findMostAppreciated', () => {
    it('ranks products by their number of positive reviews', async () => {
      await insertCatalog(db, [
        { reference: '00000001', notations: [4, 1, 1, 1] },
        { reference: '00000002', notations: [5, 4, 5] },
        { reference: '00000003', notations: [3, 3, 3, 3, 3] },
        { reference: '00000004', notations: [4, 5] },
      ]);

      const products = await repository.findMostAppreciated({ positiveNotationAbove: 3, limit: 5 });

      expect(products.map((p) => [p.reference, p.positiveReviewCount])).toEqual([
        ['00000002', 3],
        ['00000004', 2],
        ['00000001', 1],
      ]);
    });

    it('leaves out products without any positive review', async () => {
      await insertCatalog(db, [{ reference: '00000001', notations: [3, 2] }, { reference: '00000002' }]);

      expect(await repository.findMostAppreciated({ positiveNotationAbove: 3, limit: 5 })).toEqual([]);
    });

    it('breaks ties on the average rating, then on the reference', async () => {
      await insertCatalog(db, [
        { reference: '00000003', notations: [4] },
        { reference: '00000001', notations: [4] },
        { reference: '00000002', notations: [5] },
      ]);

      const products = await repository.findMostAppreciated({ positiveNotationAbove: 3, limit: 5 });

      expect(products.map((p) => p.reference)).toEqual(['00000002', '00000001', '00000003']);
    });

    it('returns at most `limit` products, with their summary', async () => {
      await insertCatalog(db, [
        { reference: '00000001', name: 'Drill', notations: [5, 5] },
        { reference: '00000002', notations: [5] },
      ]);

      expect(await repository.findMostAppreciated({ positiveNotationAbove: 3, limit: 1 })).toEqual([
        {
          reference: '00000001',
          name: 'Drill',
          price: 10,
          currency: 'EUR',
          stock: 1,
          reviewCount: 2,
          averageRating: 5,
          positiveReviewCount: 2,
        },
      ]);
    });
  });

  describe('findLowestRated', () => {
    it('keeps products averaging strictly below the threshold, lowest first', async () => {
      await insertCatalog(db, [
        { reference: '00000001', notations: [2, 3] },
        { reference: '00000002', notations: [1] },
        { reference: '00000003', notations: [3] },
        { reference: '00000004', notations: [5, 4] },
      ]);

      const products = await repository.findLowestRated({ averageRatingBelow: 3, limit: 5 });

      expect(products.map((p) => [p.reference, p.averageRating])).toEqual([
        ['00000002', 1],
        ['00000001', 2.5],
      ]);
    });

    it('leaves out products that have no review', async () => {
      await insertCatalog(db, [{ reference: '00000001' }]);

      expect(await repository.findLowestRated({ averageRatingBelow: 3, limit: 5 })).toEqual([]);
    });

    it('breaks ties on the reference and returns at most `limit` products', async () => {
      await insertCatalog(db, [
        { reference: '00000002', notations: [1] },
        { reference: '00000001', notations: [1] },
        { reference: '00000003', notations: [1] },
      ]);

      const products = await repository.findLowestRated({ averageRatingBelow: 3, limit: 2 });

      expect(products.map((p) => p.reference)).toEqual(['00000001', '00000002']);
    });
  });
});
