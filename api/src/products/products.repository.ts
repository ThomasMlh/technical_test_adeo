import type { Pagination } from '../common/pagination/page.js';
import type { AppreciatedProduct, ProductDetails, ProductSummary } from './product.js';

/**
 * Port: what the products feature needs from storage.
 * An abstract class (not an interface) so it can serve as Nest's injection token.
 */
export abstract class ProductsRepository {
  abstract findPage(pagination: Pagination): Promise<{ items: ProductSummary[]; totalItems: number }>;

  abstract findByReference(reference: string): Promise<ProductDetails | null>;

  /** Products ordered by their number of reviews with a notation above `positiveNotationAbove`. */
  abstract findMostAppreciated(criteria: {
    positiveNotationAbove: number;
    limit: number;
  }): Promise<AppreciatedProduct[]>;

  /** Reviewed products whose average rating is below `averageRatingBelow`, lowest first. */
  abstract findLowestRated(criteria: {
    averageRatingBelow: number;
    limit: number;
  }): Promise<ProductSummary[]>;
}
