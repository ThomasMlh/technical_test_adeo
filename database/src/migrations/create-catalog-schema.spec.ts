import { PgliteDatabase } from '../../test/support/pglite-database.js';
import { CreateCatalogSchema1795449600000 } from './1795449600000-CreateCatalogSchema.js';

describe('CreateCatalogSchema migration', () => {
  let db: PgliteDatabase;

  beforeEach(async () => {
    db = await PgliteDatabase.create();
    await db.migrateUp(new CreateCatalogSchema1795449600000());
  });

  afterEach(() => db.close());

  const insertProduct = (overrides: Record<string, unknown> = {}) => {
    const product = {
      reference: '59033201',
      name: 'Drill',
      description: 'A drill',
      price: 972.5,
      currency: 'EUR',
      stock: 415,
      ...overrides,
    };
    return db.query<{ id: number }>(
      `INSERT INTO products (reference, name, description, price, currency, stock)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      Object.values(product),
    );
  };

  const insertAuthor = (
    firstName = 'Poha',
    lastName = 'Kuxero',
    type = 'professional',
  ) =>
    db.query<{ id: number }>(
      `INSERT INTO authors (first_name, last_name, type) VALUES ($1, $2, $3) RETURNING id`,
      [firstName, lastName, type],
    );

  const insertReview = (productId: number, authorId: number, notation = 5) =>
    db.query(
      `INSERT INTO reviews (product_id, author_id, notation, comment, reviewed_at)
       VALUES ($1, $2, $3, 'Great', '2025-04-06T02:09:10Z')`,
      [productId, authorId, notation],
    );

  describe('products', () => {
    it('stores a product and generates its id', async () => {
      const [{ id }] = await insertProduct();
      expect(id).toEqual(expect.any(Number));
    });

    it('keeps the price exact, as a decimal', async () => {
      await insertProduct({ price: 0.1 + 0.2 });
      const [{ price }] = await db.query<{ price: string }>(
        'SELECT price FROM products',
      );
      expect(price).toBe('0.30');
    });

    it('rejects a second product with the same reference', async () => {
      await insertProduct();
      await expect(insertProduct()).rejects.toThrow(/products_reference_key/);
    });

    it.each([
      ['a negative price', { price: -1 }],
      ['a negative stock', { stock: -1 }],
      ['a currency that is not an ISO 4217 code', { currency: 'eur' }],
    ])('rejects %s', async (_, overrides) => {
      await expect(insertProduct(overrides)).rejects.toThrow(
        /violates check constraint/,
      );
    });
  });

  describe('authors', () => {
    it('only accepts the professional and amateur types', async () => {
      await expect(insertAuthor('Ana', 'Lima', 'robot')).rejects.toThrow(
        /invalid input value for enum author_type/,
      );
    });

    it('rejects the same author twice', async () => {
      await insertAuthor();
      await expect(insertAuthor()).rejects.toThrow(/authors_identity_key/);
    });
  });

  describe('reviews', () => {
    it.each([0, 6])(
      'rejects a notation of %i (outside 1..5)',
      async (notation) => {
        const [product] = await insertProduct();
        const [author] = await insertAuthor();
        await expect(
          insertReview(product.id, author.id, notation),
        ).rejects.toThrow(/violates check constraint/);
      },
    );

    it('rejects a review of an unknown product', async () => {
      const [author] = await insertAuthor();
      await expect(insertReview(9999, author.id)).rejects.toThrow(
        /violates foreign key/,
      );
    });

    it('deletes the reviews of a deleted product', async () => {
      const [product] = await insertProduct();
      const [author] = await insertAuthor();
      await insertReview(product.id, author.id);

      await db.query('DELETE FROM products WHERE id = $1', [product.id]);

      expect(await db.query('SELECT * FROM reviews')).toEqual([]);
    });

    it('refuses to delete an author who still has reviews', async () => {
      const [product] = await insertProduct();
      const [author] = await insertAuthor();
      await insertReview(product.id, author.id);

      await expect(
        db.query('DELETE FROM authors WHERE id = $1', [author.id]),
      ).rejects.toThrow(
        /violates RESTRICT setting of foreign key constraint "reviews_author_id_fkey"/,
      );
    });

    it('indexes the foreign keys used to list the reviews of a product or an author', async () => {
      const indexes = await db.query<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'reviews'`,
      );
      expect(indexes.map((i) => i.indexname)).toEqual(
        expect.arrayContaining([
          'reviews_product_id_idx',
          'reviews_author_id_idx',
        ]),
      );
    });
  });

  it('down() removes everything up() created', async () => {
    await db.migrateDown(new CreateCatalogSchema1795449600000());

    const tables = await db.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const types = await db.query(
      `SELECT typname FROM pg_type WHERE typname = 'author_type'`,
    );
    expect(tables).toEqual([]);
    expect(types).toEqual([]);
  });
});
