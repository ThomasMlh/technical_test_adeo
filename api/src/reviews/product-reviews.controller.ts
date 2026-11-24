import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { ReviewPageDto } from './dto/review-response.dto.js';
import { ReviewsService } from './reviews.service.js';

/** Reviews seen from a product: a sub-resource owned by the reviews feature. */
@ApiTags('reviews')
@Controller('products/:reference/reviews')
export class ProductReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List the reviews of a product, most recent first' })
  @ApiParam({
    name: 'reference',
    example: '59033201',
    description: 'Business reference of the product.',
  })
  @ApiOkResponse({ type: ReviewPageDto })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  @ApiNotFoundResponse({ description: 'No product has this reference.' })
  list(
    @Param('reference') reference: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<ReviewPageDto> {
    return this.reviews.listOfProduct(reference, pagination);
  }
}
