import { Injectable } from '@nestjs/common';
import { offsetOf } from '../common/pagination/page.js';
import { SqlClient } from '../database/sql-client.js';
import type { Author } from './author.js';
import { type AuthorCriteria, AuthorsRepository } from './authors.repository.js';

/** Columns of an `Author`, for a query over `authors a LEFT JOIN reviews r … GROUP BY a`. */
const AUTHOR_COLUMNS = `
  a.id,
  a.first_name AS "firstName",
  a.last_name AS "lastName",
  a.type,
  count(r.id)::int AS "reviewCount"`;

/** `$n` is the optional type: NULL matches every author. */
const typeFilter = (n: number) => `($${n}::text IS NULL OR type::text = $${n})`;

@Injectable()
export class PostgresAuthorsRepository extends AuthorsRepository {
  constructor(private readonly sql: SqlClient) {
    super();
  }

  async findPage(criteria: AuthorCriteria) {
    const type = criteria.type ?? null;
    // As for products, the page is cut first, so reviews are counted for these authors only.
    const [items, [{ totalItems }]] = await Promise.all([
      this.sql.query<Author>(
        `SELECT ${AUTHOR_COLUMNS}
         FROM (SELECT * FROM authors WHERE ${typeFilter(3)}
               ORDER BY last_name, first_name, id LIMIT $1 OFFSET $2) a
         LEFT JOIN reviews r ON r.author_id = a.id
         GROUP BY a.id, a.first_name, a.last_name, a.type
         ORDER BY a.last_name, a.first_name, a.id`,
        [criteria.limit, offsetOf(criteria), type],
      ),
      this.sql.query<{ totalItems: number }>(
        `SELECT count(*)::int AS "totalItems" FROM authors WHERE ${typeFilter(1)}`,
        [type],
      ),
    ]);
    return { items, totalItems };
  }

  async findById(id: number): Promise<Author | null> {
    const [author] = await this.sql.query<Author>(
      `SELECT ${AUTHOR_COLUMNS}
       FROM authors a
       LEFT JOIN reviews r ON r.author_id = a.id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id],
    );
    return author ?? null;
  }
}
