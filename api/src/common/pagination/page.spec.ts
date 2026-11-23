import { offsetOf, toPage } from './page.js';

describe('offsetOf', () => {
  it.each([
    [{ page: 1, limit: 20 }, 0],
    [{ page: 2, limit: 20 }, 20],
    [{ page: 3, limit: 5 }, 10],
  ])('skips the rows of the previous pages (%o → %i)', (pagination, offset) => {
    expect(offsetOf(pagination)).toBe(offset);
  });
});

describe('toPage', () => {
  it('wraps the items with the pagination metadata', () => {
    expect(toPage(['a', 'b'], 42, { page: 2, limit: 2 })).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 2, totalItems: 42, totalPages: 21 },
    });
  });

  it('counts a last, partial page', () => {
    expect(toPage([], 41, { page: 1, limit: 20 }).meta.totalPages).toBe(3);
  });

  it('has no page at all when there is nothing to list', () => {
    expect(toPage([], 0, { page: 1, limit: 20 }).meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
    });
  });
});
