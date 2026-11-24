export type AuthorType = 'professional' | 'amateur';

/** The author, as shown alongside a review. */
export interface ReviewAuthor {
  id: number;
  firstName: string;
  lastName: string;
  type: AuthorType;
}

export interface Review {
  id: number;
  /** 1 to 5. */
  notation: number;
  comment: string;
  reviewedAt: Date;
  /** Reference of the reviewed product; fetch `/products/:reference` for its details. */
  productReference: string;
  author: ReviewAuthor;
}
