import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../common/pagination/page-meta.dto.js';
import type { Page } from '../../common/pagination/page.js';
import { type Author, AUTHOR_TYPES, type AuthorType } from '../author.js';

/** OpenAPI descriptions of the authors responses. */
export class AuthorDto implements Author {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'Poha' })
  firstName: string;

  @ApiProperty({ example: 'Kuxero' })
  lastName: string;

  @ApiProperty({ enum: AUTHOR_TYPES, example: 'professional' })
  type: AuthorType;

  @ApiProperty({ example: 1, description: 'Number of reviews written by the author; see `/authors/{id}/reviews`.' })
  reviewCount: number;
}

export class AuthorPageDto implements Page<Author> {
  @ApiProperty({ type: [AuthorDto] })
  data: AuthorDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
