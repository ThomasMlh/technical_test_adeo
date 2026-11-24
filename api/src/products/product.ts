/** A product as listed: enough to display it, without its long description. */
export interface ProductSummary {
  reference: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  reviewCount: number;
  /** Average notation (1–5) rounded to 2 decimals, `null` when the product has no review. */
  averageRating: number | null;
}

export interface ProductDetails extends ProductSummary {
  description: string;
}

export interface AppreciatedProduct extends ProductSummary {
  positiveReviewCount: number;
}
