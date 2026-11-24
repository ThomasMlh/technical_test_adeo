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
import {
  AppreciatedProductDto,
  ProductDetailsDto,
  ProductPageDto,
  ProductSummaryDto,
} from './dto/product-response.dto.js';
import { RankingQueryDto } from './dto/ranking-query.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products, sorted by name' })
  @ApiOkResponse({ type: ProductPageDto })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  list(@Query() pagination: PaginationQueryDto): Promise<ProductPageDto> {
    return this.products.list(pagination);
  }

  // Static paths are declared before `:reference`, which would otherwise capture them.
  @Get('most-appreciated')
  @ApiOperation({
    summary: 'Products with the most positive reviews',
    description:
      'A review is positive when its notation is strictly greater than 3. ' +
      'Products without any positive review are left out. Ties are broken on the average rating.',
  })
  @ApiOkResponse({ type: [AppreciatedProductDto] })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  mostAppreciated(
    @Query() { limit }: RankingQueryDto,
  ): Promise<AppreciatedProductDto[]> {
    return this.products.mostAppreciated(limit);
  }

  @Get('lowest-rated')
  @ApiOperation({
    summary: 'Products with an average rating below 3, lowest first',
    description: 'Products without any review have no rating and are left out.',
  })
  @ApiOkResponse({ type: [ProductSummaryDto] })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  lowestRated(
    @Query() { limit }: RankingQueryDto,
  ): Promise<ProductSummaryDto[]> {
    return this.products.lowestRated(limit);
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Get a product, with its description' })
  @ApiParam({
    name: 'reference',
    example: '59033201',
    description: 'Business reference of the product.',
  })
  @ApiOkResponse({ type: ProductDetailsDto })
  @ApiNotFoundResponse({ description: 'No product has this reference.' })
  getByReference(
    @Param('reference') reference: string,
  ): Promise<ProductDetailsDto> {
    return this.products.getByReference(reference);
  }
}
