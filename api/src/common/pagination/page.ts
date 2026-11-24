export interface Pagination {
  /** 1-based page number. */
  page: number;
  /** Maximum number of items per page. */
  limit: number;
}

export interface PageMeta extends Pagination {
  totalItems: number;
  totalPages: number;
}

/** One page of a list, with what a client needs to fetch the others. */
export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export const offsetOf = ({ page, limit }: Pagination): number => (page - 1) * limit;

export const toPage = <T>(data: T[], totalItems: number, { page, limit }: Pagination): Page<T> => ({
  data,
  meta: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
});
