import type { Pagination } from '../common/pagination/page.js';
import type { Review } from './review.js';

export interface ReviewSlice {
  items: Review[];
  totalItems: number;
}

/** Port: what the reviews feature needs from storage. */
export abstract class ReviewsRepository {
  /** Every review, most recent first. */
  abstract findPage(pagination: Pagination): Promise<ReviewSlice>;

  abstract findById(id: number): Promise<Review | null>;

  /** Reviews of one product, most recent first; `null` when the product does not exist. */
  abstract findPageOfProduct(reference: string, pagination: Pagination): Promise<ReviewSlice | null>;

  /** Reviews written by one author, most recent first; `null` when the author does not exist. */
  abstract findPageOfAuthor(authorId: number, pagination: Pagination): Promise<ReviewSlice | null>;
}
