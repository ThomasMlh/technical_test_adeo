import { ApiProperty } from '@nestjs/swagger';
import type { PageMeta } from './page.js';

/** OpenAPI description of `PageMeta`, shared by every paginated response. */
export class PageMetaDto implements PageMeta {
  @ApiProperty({ example: 1, description: 'Current page, starting at 1.' })
  page: number;

  @ApiProperty({ example: 20, description: 'Maximum number of items per page.' })
  limit: number;

  @ApiProperty({ example: 250, description: 'Number of items across all pages.' })
  totalItems: number;

  @ApiProperty({ example: 13, description: 'Number of pages; the last page is `totalPages`.' })
  totalPages: number;
}
