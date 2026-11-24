import { Injectable } from '@nestjs/common';
import { offsetOf, type Pagination } from '../common/pagination/page.js';
import { SqlClient } from '../database/sql-client.js';
import type { Review } from './review.js';
import { ReviewsRepository, type ReviewSlice } from './reviews.repository.js';

/** A `Review`, with its product reference and its author, from one row. */
const SELECT_REVIEWS = `
  SELECT r.id,
         r.notation,
         r.comment,
         r.reviewed_at AS "reviewedAt",
         p.reference AS "productReference",
         json_build_object(
           'id', a.id, 'firstName', a.first_name, 'lastName', a.last_name, 'type', a.type
         ) AS author
  FROM reviews r
  JOIN products p ON p.id = r.product_id
  JOIN authors a ON a.id = r.author_id`;

/** Most recent first; the id breaks ties so that pages never overlap. */
const MOST_RECENT_FIRST = 'ORDER BY r.reviewed_at DESC, r.id DESC';

@Injectable()
export class PostgresReviewsRepository extends ReviewsRepository {
  constructor(private readonly sql: SqlClient) {
    super();
  }

  async findPage(pagination: Pagination): Promise<ReviewSlice> {
    const [items, [{ totalItems }]] = await Promise.all([
      this.sql.query<Review>(
        `${SELECT_REVIEWS} ${MOST_RECENT_FIRST} LIMIT $1 OFFSET $2`,
        [pagination.limit, offsetOf(pagination)],
      ),
      this.sql.query<{ totalItems: number }>(
        `SELECT count(*)::int AS "totalItems" FROM reviews`,
      ),
    ]);
    return { items, totalItems };
  }

  async findById(id: number): Promise<Review | null> {
    const [review] = await this.sql.query<Review>(
      `${SELECT_REVIEWS} WHERE r.id = $1`,
      [id],
    );
    return review ?? null;
  }

  async findPageOfProduct(
    reference: string,
    pagination: Pagination,
  ): Promise<ReviewSlice | null> {
    // Looked up first to tell an unknown product (null) from one without reviews (empty slice).
    const [product] = await this.sql.query<{ id: number }>(
      'SELECT id FROM products WHERE reference = $1',
      [reference],
    );
    return product
      ? this.findPageWhere('product_id', product.id, pagination)
      : null;
  }

  async findPageOfAuthor(
    authorId: number,
    pagination: Pagination,
  ): Promise<ReviewSlice | null> {
    const [author] = await this.sql.query(
      'SELECT 1 FROM authors WHERE id = $1',
      [authorId],
    );
    return author
      ? this.findPageWhere('author_id', authorId, pagination)
      : null;
  }

  /** One page of the reviews whose foreign key `column` (indexed) equals `id`. */
  private async findPageWhere(
    column: 'product_id' | 'author_id',
    id: number,
    pagination: Pagination,
  ): Promise<ReviewSlice> {
    const [items, [{ totalItems }]] = await Promise.all([
      this.sql.query<Review>(
        `${SELECT_REVIEWS} WHERE r.${column} = $1 ${MOST_RECENT_FIRST} LIMIT $2 OFFSET $3`,
        [id, pagination.limit, offsetOf(pagination)],
      ),
      this.sql.query<{ totalItems: number }>(
        `SELECT count(*)::int AS "totalItems" FROM reviews WHERE ${column} = $1`,
        [id],
      ),
    ]);
    return { items, totalItems };
  }
}
