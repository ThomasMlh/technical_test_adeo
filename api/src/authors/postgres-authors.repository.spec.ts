import { PgliteDatabase } from 'catalog-database/testing';
import { insertCatalog } from '../../test/support/catalog-fixture.js';
import { PostgresAuthorsRepository } from './postgres-authors.repository.js';

const zola = { firstName: 'Zola', lastName: 'Abara', type: 'amateur' } as const;
const ana = { firstName: 'Ana', lastName: 'Lima', type: 'professional' } as const;
const bob = { firstName: 'Bob', lastName: 'Lima', type: 'amateur' } as const;

describe('PostgresAuthorsRepository', () => {
  let db: PgliteDatabase;
  let repository: PostgresAuthorsRepository;

  beforeAll(async () => {
    db = await PgliteDatabase.createMigrated();
    repository = new PostgresAuthorsRepository(db);
  });

  afterAll(() => db.close());

  beforeEach(async () => {
    await db.query('TRUNCATE reviews, authors, products RESTART IDENTITY');
    await insertCatalog(db, [
      { reference: '00000001', reviews: [{ notation: 5, author: bob }, { notation: 4, author: ana }] },
      { reference: '00000002', reviews: [{ notation: 3, author: bob }, { notation: 1, author: zola }] },
    ]);
  });

  describe('findPage', () => {
    it('lists authors by last name then first name, with their review count', async () => {
      const { items, totalItems } = await repository.findPage({ page: 1, limit: 10 });

      expect(totalItems).toBe(3);
      expect(items).toEqual([
        { id: 3, firstName: 'Zola', lastName: 'Abara', type: 'amateur', reviewCount: 1 },
        { id: 2, firstName: 'Ana', lastName: 'Lima', type: 'professional', reviewCount: 1 },
        { id: 1, firstName: 'Bob', lastName: 'Lima', type: 'amateur', reviewCount: 2 },
      ]);
    });

    it('returns only the requested page, and the total of all authors', async () => {
      const { items, totalItems } = await repository.findPage({ page: 2, limit: 2 });

      expect(items.map((a) => a.firstName)).toEqual(['Bob']);
      expect(totalItems).toBe(3);
    });

    it('keeps only the authors of the requested type, and counts only them', async () => {
      const { items, totalItems } = await repository.findPage({ page: 1, limit: 10, type: 'amateur' });

      expect(items.map((a) => a.firstName)).toEqual(['Zola', 'Bob']);
      expect(totalItems).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns the author with their review count', async () => {
      expect(await repository.findById(1)).toEqual({
        id: 1,
        firstName: 'Bob',
        lastName: 'Lima',
        type: 'amateur',
        reviewCount: 2,
      });
    });

    it('returns null for an unknown id', async () => {
      expect(await repository.findById(999)).toBeNull();
    });
  });
});
