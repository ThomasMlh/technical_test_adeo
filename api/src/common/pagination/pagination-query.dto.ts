import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import type { Pagination } from './page.js';

export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDto implements Pagination {
  @ApiPropertyOptional({ description: 'Page number, starting at 1.', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page.',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 20;
}
