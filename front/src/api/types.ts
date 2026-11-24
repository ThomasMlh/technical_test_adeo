/** Response shapes of the catalog API (see api/README.md). */

export interface ProductSummary {
  reference: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  reviewCount: number;
  /** Average notation (1–5), `null` when the product has no review. */
  averageRating: number | null;
}

export interface AppreciatedProduct extends ProductSummary {
  /** Reviews with a notation strictly greater than 3. */
  positiveReviewCount: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}
