import { Injectable } from '@nestjs/common';
import type { Pagination } from '../common/pagination/page.js';
import { offsetOf } from '../common/pagination/page.js';
import { SqlClient } from '../database/sql-client.js';
import type { AppreciatedProduct, ProductDetails, ProductSummary } from './product.js';
import { ProductsRepository } from './products.repository.js';

/**
 * Columns of a `ProductSummary`, for a query over `products p LEFT JOIN reviews r … GROUP BY p`.
 * Casts make the driver return JS numbers: `numeric` and `count()` would otherwise come back as strings.
 */
const SUMMARY_COLUMNS = `
  p.reference,
  p.name,
  p.price::float8 AS price,
  p.currency,
  p.stock,
  count(r.id)::int AS "reviewCount",
  round(avg(r.notation), 2)::float8 AS "averageRating"`;

@Injectable()
export class PostgresProductsRepository extends ProductsRepository {
  constructor(private readonly sql: SqlClient) {
    super();
  }

  async findPage(pagination: Pagination) {
    // The page is cut first, so reviews are aggregated for these products only.
    const [items, [{ totalItems }]] = await Promise.all([
      this.sql.query<ProductSummary>(
        `SELECT ${SUMMARY_COLUMNS}
         FROM (SELECT * FROM products ORDER BY name, reference LIMIT $1 OFFSET $2) p
         LEFT JOIN reviews r ON r.product_id = p.id
         GROUP BY p.id, p.reference, p.name, p.price, p.currency, p.stock
         ORDER BY p.name, p.reference`,
        [pagination.limit, offsetOf(pagination)],
      ),
      this.sql.query<{ totalItems: number }>(`SELECT count(*)::int AS "totalItems" FROM products`),
    ]);
    return { items, totalItems };
  }

  async findByReference(reference: string): Promise<ProductDetails | null> {
    const [product] = await this.sql.query<ProductDetails>(
      `SELECT ${SUMMARY_COLUMNS}, p.description
       FROM products p
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.reference = $1
       GROUP BY p.id`,
      [reference],
    );
    return product ?? null;
  }

  findMostAppreciated({ positiveNotationAbove, limit }: { positiveNotationAbove: number; limit: number }) {
    return this.sql.query<AppreciatedProduct>(
      `SELECT ${SUMMARY_COLUMNS},
              count(*) FILTER (WHERE r.notation > $1)::int AS "positiveReviewCount"
       FROM products p
       JOIN reviews r ON r.product_id = p.id
       GROUP BY p.id
       HAVING count(*) FILTER (WHERE r.notation > $1) > 0
       ORDER BY "positiveReviewCount" DESC, avg(r.notation) DESC, p.reference
       LIMIT $2`,
      [positiveNotationAbove, limit],
    );
  }

  findLowestRated({ averageRatingBelow, limit }: { averageRatingBelow: number; limit: number }) {
    // Inner JOIN: a product without reviews has no rating, so it cannot be lowest-rated.
    return this.sql.query<ProductSummary>(
      `SELECT ${SUMMARY_COLUMNS}
       FROM products p
       JOIN reviews r ON r.product_id = p.id
       GROUP BY p.id
       HAVING avg(r.notation) < $1
       ORDER BY avg(r.notation), p.reference
       LIMIT $2`,
      [averageRatingBelow, limit],
    );
  }
}
