import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import { AUTHOR_TYPES, type AuthorType } from '../author.js';
import type { AuthorCriteria } from '../authors.repository.js';

export class AuthorsQueryDto extends PaginationQueryDto implements AuthorCriteria {
  @ApiPropertyOptional({ enum: AUTHOR_TYPES, description: 'Only authors of this type.' })
  // A query string value cannot be null: optional only means "may be left out" here.
  @IsOptional()
  @IsIn(AUTHOR_TYPES)
  type?: AuthorType;
}
