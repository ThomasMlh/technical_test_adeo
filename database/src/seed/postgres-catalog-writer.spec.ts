import { PgliteDatabase } from '../../test/support/pglite-database.js';
import type { NormalizedCatalog } from './normalize-catalog.js';
import { PostgresCatalogWriter } from './postgres-catalog-writer.js';

const poha = JSON.stringify(['Poha', 'Kuxero', 'professional']);
const ana = JSON.stringify(['Ana', 'Lima', 'amateur']);

const catalog: NormalizedCatalog = {
  products: [
    {
      reference: '00000001',
      name: 'Drill',
      description: 'D',
      price: 972.5,
      currency: 'EUR',
      stock: 4,
    },
    {
      reference: '00000002',
      name: 'Saw',
      description: 'S',
      price: 13.06,
      currency: 'EUR',
      stock: 0,
    },
  ],
  authors: [
    { key: poha, firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
    { key: ana, firstName: 'Ana', lastName: 'Lima', type: 'amateur' },
  ],
  reviews: [
    {
      productReference: '00000001',
      authorKey: poha,
      notation: 5,
      comment: 'Great',
      reviewedAt: '2025-04-06T02:09:10Z',
    },
    {
      productReference: '00000001',
      authorKey: ana,
      notation: 2,
      comment: 'Meh',
      reviewedAt: '2024-01-01T00:00:00Z',
    },
    {
      productReference: '00000002',
      authorKey: ana,
      notation: 4,
      comment: 'Nice',
      reviewedAt: '2023-05-05T12:00:00Z',
    },
  ],
};

const reviewsWithTheirProductAndAuthor = (db: PgliteDatabase) =>
  db.query(`
    SELECT p.reference, a.first_name, r.notation, r.comment, r.reviewed_at
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    JOIN authors a ON a.id = r.author_id
    ORDER BY p.reference, r.notation`);

describe('PostgresCatalogWriter', () => {
  let db: PgliteDatabase;
  let writer: PostgresCatalogWriter;

  beforeEach(async () => {
    db = await PgliteDatabase.createMigrated();
    writer = new PostgresCatalogWriter(db);
  });

  afterEach(() => db.close());

  it('stores every product, author and review', async () => {
    await writer.replaceCatalog(catalog);

    const [{ products, authors, reviews }] = await db.query<
      Record<string, number>
    >(`
      SELECT (SELECT count(*)::int FROM products) AS products,
             (SELECT count(*)::int FROM authors)  AS authors,
             (SELECT count(*)::int FROM reviews)  AS reviews`);
    expect({ products, authors, reviews }).toEqual({
      products: 2,
      authors: 2,
      reviews: 3,
    });
  });

  it('links each review to its product and its author', async () => {
    await writer.replaceCatalog(catalog);

    expect(await reviewsWithTheirProductAndAuthor(db)).toEqual([
      {
        reference: '00000001',
        first_name: 'Ana',
        notation: 2,
        comment: 'Meh',
        reviewed_at: new Date('2024-01-01T00:00:00Z'),
      },
      {
        reference: '00000001',
        first_name: 'Poha',
        notation: 5,
        comment: 'Great',
        reviewed_at: new Date('2025-04-06T02:09:10Z'),
      },
      {
        reference: '00000002',
        first_name: 'Ana',
        notation: 4,
        comment: 'Nice',
        reviewed_at: new Date('2023-05-05T12:00:00Z'),
      },
    ]);
  });

  it('can run again: the catalog is replaced, not duplicated', async () => {
    await writer.replaceCatalog(catalog);
    await writer.replaceCatalog(catalog);

    const [{ count }] = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM reviews',
    );
    expect(count).toBe(3);
  });

  it('writes nothing when one row is invalid, and keeps the previous catalog', async () => {
    await writer.replaceCatalog(catalog);
    const invalid: NormalizedCatalog = {
      ...catalog,
      reviews: [{ ...catalog.reviews[0], notation: 9 }],
    };

    await expect(writer.replaceCatalog(invalid)).rejects.toThrow(
      /reviews_notation_check/,
    );

    expect(await reviewsWithTheirProductAndAuthor(db)).toHaveLength(3);
  });

  it('fails clearly when a review points to an author missing from the catalog', async () => {
    const orphan: NormalizedCatalog = {
      ...catalog,
      reviews: [{ ...catalog.reviews[0], authorKey: 'nobody' }],
    };

    await expect(writer.replaceCatalog(orphan)).rejects.toThrow(
      /unknown author "nobody"/,
    );
  });
});
