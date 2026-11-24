import type { SqlClient } from '../../src/database/sql-client.js';

export interface AuthorFixture {
  firstName: string;
  lastName?: string;
  type?: 'professional' | 'amateur';
}

export interface ReviewFixture {
  notation: number;
  comment?: string;
  /** ISO 8601 date-time. */
  reviewedAt?: string;
  /** The same author given twice is stored once. Defaults to a new author. */
  author?: AuthorFixture;
}

export interface ProductFixture {
  reference: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  /** Shorthand: one review per notation, each by a different author. */
  notations?: number[];
  reviews?: ReviewFixture[];
}

/** Inserts products and their reviews, with the fewest details a test needs to spell out. */
export async function insertCatalog(db: SqlClient, products: ProductFixture[]): Promise<void> {
  let anonymousAuthors = 0;
  for (const product of products) {
    const [{ id: productId }] = await db.query<{ id: number }>(
      `INSERT INTO products (reference, name, description, price, currency, stock)
       VALUES ($1, $2, $3, $4, 'EUR', $5) RETURNING id`,
      [
        product.reference,
        product.name ?? `Product ${product.reference}`,
        product.description ?? `Description of ${product.reference}`,
        product.price ?? 10,
        product.stock ?? 1,
      ],
    );

    const reviews: ReviewFixture[] = [
      ...(product.notations ?? []).map((notation) => ({ notation })),
      ...(product.reviews ?? []),
    ];
    for (const review of reviews) {
      const author = review.author ?? { firstName: `Author${(anonymousAuthors += 1)}` };
      const identity = [author.firstName, author.lastName ?? 'Doe', author.type ?? 'amateur'];
      // Looked up before inserting: an upsert would consume an id even when the author exists.
      const [existing] = await db.query<{ id: number }>(
        'SELECT id FROM authors WHERE first_name = $1 AND last_name = $2 AND type = $3',
        identity,
      );
      const authorId =
        existing?.id ??
        (
          await db.query<{ id: number }>(
            'INSERT INTO authors (first_name, last_name, type) VALUES ($1, $2, $3) RETURNING id',
            identity,
          )
        )[0].id;
      await db.query(
        `INSERT INTO reviews (product_id, author_id, notation, comment, reviewed_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          productId,
          authorId,
          review.notation,
          review.comment ?? 'A comment',
          review.reviewedAt ?? '2025-01-01T00:00:00Z',
        ],
      );
    }
  }
}
