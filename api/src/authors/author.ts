export const AUTHOR_TYPES = ['professional', 'amateur'] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

export interface Author {
  id: number;
  firstName: string;
  lastName: string;
  type: AuthorType;
  /** Number of reviews written by the author. */
  reviewCount: number;
}
