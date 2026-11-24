import type { SqlClient, TransactionalSqlClient } from '../sql-client.js';
import {
  authorKeyOf,
  type AuthorRow,
  type NormalizedCatalog,
  type ProductRow,
  type ReviewRow,
} from './normalize-catalog.js';

export interface CatalogWriter {
  /** Makes the database hold exactly `catalog`, all or nothing. */
  replaceCatalog(catalog: NormalizedCatalog): Promise<void>;
}

/**
 * Writes the catalog in one transaction: empty the tables, then one bulk
 * INSERT per table (`unnest` of arrays: 3 statements whatever the volume).
 * Being a full replacement, the seed can run any number of times.
 */
export class PostgresCatalogWriter implements CatalogWriter {
  constructor(private readonly database: TransactionalSqlClient) {}

  replaceCatalog(catalog: NormalizedCatalog): Promise<void> {
    return this.database.transaction(async (client) => {
      await client.query(
        'TRUNCATE reviews, authors, products RESTART IDENTITY',
      );
      const productIds = await this.insertProducts(client, catalog.products);
      const authorIds = await this.insertAuthors(client, catalog.authors);
      await this.insertReviews(client, catalog.reviews, productIds, authorIds);
    });
  }

  private async insertProducts(client: SqlClient, products: ProductRow[]) {
    const rows = await client.query<{ id: number; reference: string }>(
      `INSERT INTO products (reference, name, description, price, currency, stock)
       SELECT * FROM unnest($1::varchar[], $2::text[], $3::text[], $4::numeric[], $5::char(3)[], $6::integer[])
       RETURNING id, reference`,
      [
        products.map((p) => p.reference),
        products.map((p) => p.name),
        products.map((p) => p.description),
        products.map((p) => p.price),
        products.map((p) => p.currency),
        products.map((p) => p.stock),
      ],
    );
    return new Map(rows.map((row) => [row.reference, row.id]));
  }

  private async insertAuthors(client: SqlClient, authors: AuthorRow[]) {
    // RETURNING order is not guaranteed: ids are matched back on the author's identity.
    // (`text[]` then cast: some drivers cannot serialize an array of a custom enum.)
    const rows = await client.query<{ id: number } & Omit<AuthorRow, 'key'>>(
      `INSERT INTO authors (first_name, last_name, type)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[]::author_type[])
       RETURNING id, first_name AS "firstName", last_name AS "lastName", type`,
      [
        authors.map((a) => a.firstName),
        authors.map((a) => a.lastName),
        authors.map((a) => a.type),
      ],
    );
    return new Map(rows.map(({ id, ...author }) => [authorKeyOf(author), id]));
  }

  private async insertReviews(
    client: SqlClient,
    reviews: ReviewRow[],
    productIds: Map<string, number>,
    authorIds: Map<string, number>,
  ) {
    const idOf = (ids: Map<string, number>, key: string, kind: string) => {
      const id = ids.get(key);
      if (id === undefined)
        throw new Error(`Review refers to an unknown ${kind} "${key}"`);
      return id;
    };

    await client.query(
      `INSERT INTO reviews (product_id, author_id, notation, comment, reviewed_at)
       SELECT * FROM unnest($1::integer[], $2::integer[], $3::smallint[], $4::text[], $5::timestamptz[])`,
      [
        reviews.map((r) => idOf(productIds, r.productReference, 'product')),
        reviews.map((r) => idOf(authorIds, r.authorKey, 'author')),
        reviews.map((r) => r.notation),
        reviews.map((r) => r.comment),
        reviews.map((r) => r.reviewedAt),
      ],
    );
  }
}
