/**
 * Shape of `data/products.json`, the catalog given with the test.
 * It is denormalized: reviews and their authors are nested inside each product.
 */
export type SourceAuthorType = 'professional' | 'amateur';

export interface SourceAuthor {
  firstName: string;
  lastName: string;
  type: SourceAuthorType;
}

export interface SourceReview {
  notation: number;
  /** Local date-time without timezone, e.g. `2025-04-06T02:09:10`. */
  date: string;
  comment: string;
  author: SourceAuthor;
}

export interface SourceProduct {
  reference: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  reviews: SourceReview[];
}
