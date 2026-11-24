import type { AppreciatedProduct, Page, ProductSummary } from './types';

/** The calls the dashboard needs, independent of how they reach the API. */
export interface CatalogApi {
  countProducts(): Promise<number>;
  countReviews(): Promise<number>;
  mostAppreciated(): Promise<AppreciatedProduct[]>;
  lowestRated(): Promise<ProductSummary[]>;
  allProducts(): Promise<ProductSummary[]>;
}

type Fetch = (url: string) => Promise<Response>;

const RANKING_SIZE = 5;
/** Largest page the API accepts. */
const MAX_PAGE_SIZE = 100;

/**
 * Catalog API over HTTP. `baseUrl` defaults to `/api`, which the Vite server
 * forwards to the API (see vite.config.ts).
 */
export function createCatalogApi(
  fetch: Fetch = globalThis.fetch.bind(globalThis),
  baseUrl = '/api',
): CatalogApi {
  async function get<T>(path: string): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GET ${url} failed: ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async function count(resource: string): Promise<number> {
    const { meta } = await get<Page<unknown>>(`/${resource}?limit=1`);
    return meta.totalItems;
  }

  const productPage = (page: number) =>
    get<Page<ProductSummary>>(`/products?page=${page}&limit=${MAX_PAGE_SIZE}`);

  return {
    countProducts: () => count('products'),
    countReviews: () => count('reviews'),
    mostAppreciated: () =>
      get(`/products/most-appreciated?limit=${RANKING_SIZE}`),
    lowestRated: () => get(`/products/lowest-rated?limit=${RANKING_SIZE}`),
    async allProducts() {
      // The first page gives the page count; the others are fetched together.
      const first = await productPage(1);
      const others = await Promise.all(
        Array.from({ length: first.meta.totalPages - 1 }, (_, i) =>
          productPage(i + 2),
        ),
      );
      return [first, ...others].flatMap(({ data }) => data);
    },
  };
}
