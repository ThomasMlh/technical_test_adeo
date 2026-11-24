import { Injectable, NotFoundException } from '@nestjs/common';
import { type Page, type Pagination, toPage } from '../common/pagination/page.js';
import type { Review } from './review.js';
import { ReviewsRepository } from './reviews.repository.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviews: ReviewsRepository) {}

  async list(pagination: Pagination): Promise<Page<Review>> {
    const { items, totalItems } = await this.reviews.findPage(pagination);
    return toPage(items, totalItems, pagination);
  }

  async getById(id: number): Promise<Review> {
    const review = await this.reviews.findById(id);
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  async listOfProduct(reference: string, pagination: Pagination): Promise<Page<Review>> {
    const slice = await this.reviews.findPageOfProduct(reference, pagination);
    if (!slice) throw new NotFoundException(`Product ${reference} not found`);
    return toPage(slice.items, slice.totalItems, pagination);
  }

  async listOfAuthor(authorId: number, pagination: Pagination): Promise<Page<Review>> {
    const slice = await this.reviews.findPageOfAuthor(authorId, pagination);
    if (!slice) throw new NotFoundException(`Author ${authorId} not found`);
    return toPage(slice.items, slice.totalItems, pagination);
  }
}
