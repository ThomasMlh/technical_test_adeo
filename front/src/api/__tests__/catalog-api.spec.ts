import { describe, expect, it, vi } from 'vitest';
import { createCatalogApi } from '../catalog-api';
import type { Page, ProductSummary } from '../types';

function product(reference: string): ProductSummary {
  return {
    reference,
    name: `Product ${reference}`,
    price: 10,
    currency: 'EUR',
    stock: 1,
    reviewCount: 0,
    averageRating: null,
  };
}

function page<T>(data: T[], page: number, totalPages: number): Page<T> {
  return {
    data,
    meta: { page, limit: data.length, totalItems: 250, totalPages },
  };
}

/** A fetch that answers each URL with the body registered for it. */
function fakeFetch(responses: Record<string, unknown>) {
  return vi.fn<(url: string) => Promise<Response>>(async (url) => {
    if (!(url in responses)) return new Response(null, { status: 404 });
    return Response.json(responses[url]);
  });
}

describe('createCatalogApi', () => {
  it('counts products and reviews from the pagination metadata', async () => {
    const fetch = fakeFetch({
      '/api/products?limit=1': page([product('1')], 1, 250),
      '/api/reviews?limit=1': {
        data: [],
        meta: { page: 1, limit: 1, totalItems: 1234, totalPages: 1234 },
      },
    });
    const api = createCatalogApi(fetch);

    expect(await api.countProducts()).toBe(250);
    expect(await api.countReviews()).toBe(1234);
  });

  it('fetches both rankings, 5 products each', async () => {
    const fetch = fakeFetch({
      '/api/products/most-appreciated?limit=5': [
        { ...product('1'), positiveReviewCount: 3 },
      ],
      '/api/products/lowest-rated?limit=5': [product('2')],
    });
    const api = createCatalogApi(fetch);

    expect(await api.mostAppreciated()).toEqual([
      { ...product('1'), positiveReviewCount: 3 },
    ]);
    expect(await api.lowestRated()).toEqual([product('2')]);
  });

  it('fetches every page of the catalog, in order', async () => {
    const fetch = fakeFetch({
      '/api/products?page=1&limit=100': page([product('1')], 1, 3),
      '/api/products?page=2&limit=100': page([product('2')], 2, 3),
      '/api/products?page=3&limit=100': page([product('3')], 3, 3),
    });
    const api = createCatalogApi(fetch);

    const products = await api.allProducts();

    expect(products.map((p) => p.reference)).toEqual(['1', '2', '3']);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('prefixes every path with the given base URL', async () => {
    const fetch = fakeFetch({
      'http://api.test/products?limit=1': page([], 1, 1),
    });

    await createCatalogApi(fetch, 'http://api.test').countProducts();

    expect(fetch).toHaveBeenCalledWith('http://api.test/products?limit=1');
  });

  it('rejects with the HTTP status when the API answers an error', async () => {
    const api = createCatalogApi(fakeFetch({}));

    await expect(api.countProducts()).rejects.toThrow(
      'GET /api/products?limit=1 failed: 404',
    );
  });
});
