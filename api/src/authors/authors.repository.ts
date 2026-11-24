import type { Pagination } from '../common/pagination/page.js';
import type { Author, AuthorType } from './author.js';

export interface AuthorCriteria extends Pagination {
  /** Only authors of this type; every author when absent. */
  type?: AuthorType;
}

/** Port: what the authors feature needs from storage. */
export abstract class AuthorsRepository {
  /** Authors sorted by last name, then first name. */
  abstract findPage(
    criteria: AuthorCriteria,
  ): Promise<{ items: Author[]; totalItems: number }>;

  abstract findById(id: number): Promise<Author | null>;
}
