import { normalizeCatalog } from './normalize-catalog.js';
import type { SourceProduct } from './source-catalog.js';

const aSourceProduct = (overrides: Partial<SourceProduct> = {}): SourceProduct => ({
  reference: '59033201',
  name: 'Drill',
  description: 'A powerful drill',
  price: 972.5,
  currency: 'EUR',
  stock: 415,
  reviews: [],
  ...overrides,
});

describe('normalizeCatalog', () => {
  it('maps each source product to a product row', () => {
    const catalog = normalizeCatalog([aSourceProduct()]);

    expect(catalog.products).toEqual([
      {
        reference: '59033201',
        name: 'Drill',
        description: 'A powerful drill',
        price: 972.5,
        currency: 'EUR',
        stock: 415,
      },
    ]);
  });

  it('returns no authors and no reviews for a product without reviews', () => {
    const catalog = normalizeCatalog([aSourceProduct({ reviews: [] })]);

    expect(catalog.authors).toEqual([]);
    expect(catalog.reviews).toEqual([]);
  });

  it('links each review to its product reference and its author key', () => {
    const catalog = normalizeCatalog([
      aSourceProduct({
        reviews: [
          {
            notation: 5,
            date: '2025-04-06T02:09:10',
            comment: 'Very practical.',
            author: { firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
          },
        ],
      }),
    ]);

    expect(catalog.authors).toEqual([
      {
        key: catalog.reviews[0].authorKey,
        firstName: 'Poha',
        lastName: 'Kuxero',
        type: 'professional',
      },
    ]);
    expect(catalog.reviews).toEqual([
      {
        productReference: '59033201',
        authorKey: catalog.authors[0].key,
        notation: 5,
        comment: 'Very practical.',
        reviewedAt: '2025-04-06T02:09:10Z',
      },
    ]);
  });

  it('interprets source dates, which have no timezone, as UTC', () => {
    const catalog = normalizeCatalog([
      aSourceProduct({
        reviews: [
          {
            notation: 3,
            date: '2020-01-01T07:47:06',
            comment: 'Fine',
            author: { firstName: 'Ana', lastName: 'Lima', type: 'amateur' },
          },
        ],
      }),
    ]);

    expect(new Date(catalog.reviews[0].reviewedAt).toISOString()).toBe(
      '2020-01-01T07:47:06.000Z',
    );
  });

  it('deduplicates an author who reviewed several products', () => {
    const author = { firstName: 'Poha', lastName: 'Kuxero', type: 'amateur' } as const;
    const review = { notation: 4, date: '2024-01-01T10:00:00', comment: 'Ok', author };

    const catalog = normalizeCatalog([
      aSourceProduct({ reference: '00000001', reviews: [review] }),
      aSourceProduct({ reference: '00000002', reviews: [review] }),
    ]);

    expect(catalog.authors).toHaveLength(1);
    expect(catalog.reviews).toHaveLength(2);
    expect(new Set(catalog.reviews.map((r) => r.authorKey)).size).toBe(1);
  });

  it('treats homonyms with a different author type as distinct authors', () => {
    const catalog = normalizeCatalog([
      aSourceProduct({
        reviews: [
          {
            notation: 4,
            date: '2024-01-01T10:00:00',
            comment: 'Ok',
            author: { firstName: 'Poha', lastName: 'Kuxero', type: 'amateur' },
          },
          {
            notation: 2,
            date: '2024-01-02T10:00:00',
            comment: 'Meh',
            author: { firstName: 'Poha', lastName: 'Kuxero', type: 'professional' },
          },
        ],
      }),
    ]);

    expect(catalog.authors).toHaveLength(2);
  });

  it('does not confuse authors whose names only differ by where they are split', () => {
    const catalog = normalizeCatalog([
      aSourceProduct({
        reviews: [
          {
            notation: 4,
            date: '2024-01-01T10:00:00',
            comment: 'Ok',
            author: { firstName: 'Ab|', lastName: 'c', type: 'amateur' },
          },
          {
            notation: 4,
            date: '2024-01-01T10:00:00',
            comment: 'Ok',
            author: { firstName: 'Ab', lastName: '|c', type: 'amateur' },
          },
        ],
      }),
    ]);

    expect(catalog.authors).toHaveLength(2);
  });
});
