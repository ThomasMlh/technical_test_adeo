import { Injectable, NotFoundException } from '@nestjs/common';
import { type Page, type Pagination, toPage } from '../common/pagination/page.js';
import type { AppreciatedProduct, ProductDetails, ProductSummary } from './product.js';
import { ProductsRepository } from './products.repository.js';

/** A review is positive when its notation is strictly greater than this. */
export const POSITIVE_NOTATION_THRESHOLD = 3;
/** A product is lowest-rated when its average rating is strictly below this. */
export const LOW_AVERAGE_RATING_THRESHOLD = 3;

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductsRepository) {}

  async list(pagination: Pagination): Promise<Page<ProductSummary>> {
    const { items, totalItems } = await this.products.findPage(pagination);
    return toPage(items, totalItems, pagination);
  }

  async getByReference(reference: string): Promise<ProductDetails> {
    const product = await this.products.findByReference(reference);
    if (!product) throw new NotFoundException(`Product ${reference} not found`);
    return product;
  }

  mostAppreciated(limit: number): Promise<AppreciatedProduct[]> {
    return this.products.findMostAppreciated({
      positiveNotationAbove: POSITIVE_NOTATION_THRESHOLD,
      limit,
    });
  }

  lowestRated(limit: number): Promise<ProductSummary[]> {
    return this.products.findLowestRated({
      averageRatingBelow: LOW_AVERAGE_RATING_THRESHOLD,
      limit,
    });
  }
}
