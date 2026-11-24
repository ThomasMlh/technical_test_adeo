import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
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

/** Reviews seen from an author: a sub-resource owned by the reviews feature. */
@ApiTags('reviews')
@Controller('authors/:id/reviews')
export class AuthorReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List the reviews written by an author, most recent first' })
  @ApiParam({ name: 'id', example: 1, description: 'Id of the author.' })
  @ApiOkResponse({ type: ReviewPageDto })
  @ApiBadRequestResponse({ description: 'The id is not an integer, or a query parameter is invalid.' })
  @ApiNotFoundResponse({ description: 'No author has this id.' })
  list(
    @Param('id', ParseIntPipe) authorId: number,
    @Query() pagination: PaginationQueryDto,
  ): Promise<ReviewPageDto> {
    return this.reviews.listOfAuthor(authorId, pagination);
  }
}
