import type { SqlClient } from '../../src/database/sql-client.js';

export interface ProductFixture {
  reference: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  /** One review per notation, each by a different author. */
  notations?: number[];
}

/** Inserts products and their reviews, with the fewest details a test needs to spell out. */
export async function insertCatalog(db: SqlClient, products: ProductFixture[]): Promise<void> {
  let authorNumber = 0;
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
    for (const notation of product.notations ?? []) {
      authorNumber += 1;
      const [{ id: authorId }] = await db.query<{ id: number }>(
        `INSERT INTO authors (first_name, last_name, type) VALUES ($1, 'Doe', 'amateur') RETURNING id`,
        [`Author${authorNumber}`],
      );
      await db.query(
        `INSERT INTO reviews (product_id, author_id, notation, comment, reviewed_at)
         VALUES ($1, $2, $3, 'A comment', '2025-01-01T00:00:00Z')`,
        [productId, authorId, notation],
      );
    }
  }
}
