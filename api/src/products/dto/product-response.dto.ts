import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../common/pagination/page-meta.dto.js';
import type { Page } from '../../common/pagination/page.js';
import type {
  AppreciatedProduct,
  ProductDetails,
  ProductSummary,
} from '../product.js';

/** OpenAPI descriptions of the products responses. */
export class ProductSummaryDto implements ProductSummary {
  @ApiProperty({
    example: '59033201',
    description: 'Unique business reference of the product.',
  })
  reference: string;

  @ApiProperty({ example: 'Cordless drill 18V' })
  name: string;

  @ApiProperty({ example: 972.5, description: 'Unit price, in `currency`.' })
  price: number;

  @ApiProperty({ example: 'EUR', description: 'ISO 4217 currency code.' })
  currency: string;

  @ApiProperty({ example: 415, description: 'Units in stock.' })
  stock: number;

  @ApiProperty({ example: 3, description: 'Number of reviews of the product.' })
  reviewCount: number;

  @ApiProperty({
    example: 4.33,
    nullable: true,
    type: Number,
    description:
      'Average notation (1 to 5), rounded to 2 decimals; null when the product has no review.',
  })
  averageRating: number | null;
}

export class ProductDetailsDto
  extends ProductSummaryDto
  implements ProductDetails
{
  @ApiProperty({ example: 'Brushless motor, two batteries included.' })
  description: string;
}

export class AppreciatedProductDto
  extends ProductSummaryDto
  implements AppreciatedProduct
{
  @ApiProperty({
    example: 3,
    description: 'Number of reviews with a notation strictly greater than 3.',
  })
  positiveReviewCount: number;
}

export class ProductPageDto implements Page<ProductSummary> {
  @ApiProperty({ type: [ProductSummaryDto] })
  data: ProductSummaryDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
