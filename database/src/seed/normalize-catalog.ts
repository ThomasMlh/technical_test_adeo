import type {
  SourceAuthor,
  SourceAuthorType,
  SourceProduct,
} from './source-catalog.js';

export interface ProductRow {
  reference: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
}

export interface AuthorRow {
  /** Natural identity of an author in the source data (no id is provided). */
  key: string;
  firstName: string;
  lastName: string;
  type: SourceAuthorType;
}

export interface ReviewRow {
  productReference: string;
  authorKey: string;
  notation: number;
  comment: string;
  /** ISO 8601 date-time in UTC. */
  reviewedAt: string;
}

/** The source catalog split into one list per table. */
export interface NormalizedCatalog {
  products: ProductRow[];
  authors: AuthorRow[];
  reviews: ReviewRow[];
}

/**
 * The source gives no author id: an author is identified by first name,
 * last name and type. JSON encoding keeps the parts apart whatever they contain.
 */
export const authorKeyOf = ({
  firstName,
  lastName,
  type,
}: SourceAuthor): string => JSON.stringify([firstName, lastName, type]);

/** Source dates carry no timezone; they are taken as UTC. */
const asUtc = (localDateTime: string): string => `${localDateTime}Z`;

export function normalizeCatalog(
  sourceProducts: SourceProduct[],
): NormalizedCatalog {
  const authorsByKey = new Map<string, AuthorRow>();
  const products: ProductRow[] = [];
  const reviews: ReviewRow[] = [];

  for (const { reviews: sourceReviews, ...product } of sourceProducts) {
    products.push(product);

    for (const { author, date, notation, comment } of sourceReviews) {
      const authorKey = authorKeyOf(author);
      if (!authorsByKey.has(authorKey)) {
        authorsByKey.set(authorKey, { key: authorKey, ...author });
      }
      reviews.push({
        productReference: product.reference,
        authorKey,
        notation,
        comment,
        reviewedAt: asUtc(date),
      });
    }
  }

  return { products, authors: [...authorsByKey.values()], reviews };
}
