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
import { ReviewDto, ReviewPageDto } from './dto/review-response.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews, most recent first' })
  @ApiOkResponse({ type: ReviewPageDto })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  list(@Query() pagination: PaginationQueryDto): Promise<ReviewPageDto> {
    return this.reviews.list(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: ReviewDto })
  @ApiBadRequestResponse({ description: 'The id is not an integer.' })
  @ApiNotFoundResponse({ description: 'No review has this id.' })
  getById(@Param('id', ParseIntPipe) id: number): Promise<ReviewDto> {
    return this.reviews.getById(id);
  }
}
