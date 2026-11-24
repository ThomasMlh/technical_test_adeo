import type { ProductSummary } from '../api/types';

/** A product with plausible values, to override in each test. */
export function aProduct(
  overrides: Partial<ProductSummary> = {},
): ProductSummary {
  return {
    reference: '00000001',
    name: 'Drill',
    price: 49.9,
    currency: 'EUR',
    stock: 12,
    reviewCount: 4,
    averageRating: 3.5,
    ...overrides,
  };
}
