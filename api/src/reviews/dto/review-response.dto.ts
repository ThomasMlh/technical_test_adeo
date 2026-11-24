import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../common/pagination/page-meta.dto.js';
import type { Page } from '../../common/pagination/page.js';
import { AUTHOR_TYPES, type AuthorType } from '../../authors/author.js';
import type { Review, ReviewAuthor } from '../review.js';

/** OpenAPI descriptions of the reviews responses. */
export class ReviewAuthorDto implements ReviewAuthor {
  @ApiProperty({
    example: 7,
    description: 'Id of the author; see `/authors/{id}`.',
  })
  id: number;

  @ApiProperty({ example: 'Poha' })
  firstName: string;

  @ApiProperty({ example: 'Kuxero' })
  lastName: string;

  @ApiProperty({ enum: AUTHOR_TYPES, example: 'professional' })
  type: AuthorType;
}

export class ReviewDto implements Review {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Rating from 1 to 5.',
  })
  notation: number;

  @ApiProperty({ example: 'Very practical and easy to use.' })
  comment: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-04-06T02:09:10.000Z',
  })
  reviewedAt: Date;

  @ApiProperty({
    example: '59033201',
    description:
      'Reference of the reviewed product; see `/products/{reference}`.',
  })
  productReference: string;

  @ApiProperty({ type: ReviewAuthorDto })
  author: ReviewAuthorDto;
}

export class ReviewPageDto implements Page<Review> {
  @ApiProperty({ type: [ReviewDto] })
  data: ReviewDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
