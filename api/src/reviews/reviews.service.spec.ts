import { NotFoundException } from '@nestjs/common';
import type { Mocked } from 'vitest';
import type { Review } from './review.js';
import { ReviewsRepository } from './reviews.repository.js';
import { ReviewsService } from './reviews.service.js';

const review: Review = {
  id: 1,
  notation: 5,
  comment: 'Very practical.',
  reviewedAt: new Date('2025-04-06T02:09:10Z'),
  productReference: '59033201',
  author: {
    id: 7,
    firstName: 'Poha',
    lastName: 'Kuxero',
    type: 'professional',
  },
};

describe('ReviewsService', () => {
  let repository: Mocked<ReviewsRepository>;
  let service: ReviewsService;

  beforeEach(() => {
    repository = {
      findPage: vi.fn(),
      findById: vi.fn(),
      findPageOfProduct: vi.fn(),
      findPageOfAuthor: vi.fn(),
    };
    service = new ReviewsService(repository);
  });

  describe('list', () => {
    it('returns the requested page with its metadata', async () => {
      repository.findPage.mockResolvedValue({
        items: [review],
        totalItems: 766,
      });

      expect(await service.list({ page: 1, limit: 20 })).toEqual({
        data: [review],
        meta: { page: 1, limit: 20, totalItems: 766, totalPages: 39 },
      });
    });
  });

  describe('getById', () => {
    it('returns the review', async () => {
      repository.findById.mockResolvedValue(review);

      await expect(service.getById(1)).resolves.toBe(review);
    });

    it('throws a not found error for an unknown id', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(
        new NotFoundException('Review 999 not found'),
      );
    });
  });

  describe('listOfProduct', () => {
    it('returns the requested page of the product reviews', async () => {
      repository.findPageOfProduct.mockResolvedValue({
        items: [review],
        totalItems: 1,
      });

      const page = await service.listOfProduct('59033201', {
        page: 1,
        limit: 20,
      });

      expect(repository.findPageOfProduct).toHaveBeenCalledWith('59033201', {
        page: 1,
        limit: 20,
      });
      expect(page.data).toEqual([review]);
      expect(page.meta.totalItems).toBe(1);
    });

    it('returns an empty page for a product without reviews', async () => {
      repository.findPageOfProduct.mockResolvedValue({
        items: [],
        totalItems: 0,
      });

      const page = await service.listOfProduct('59033201', {
        page: 1,
        limit: 20,
      });

      expect(page.data).toEqual([]);
    });

    it('throws a not found error for an unknown product', async () => {
      repository.findPageOfProduct.mockResolvedValue(null);

      await expect(
        service.listOfProduct('00000000', { page: 1, limit: 20 }),
      ).rejects.toThrow(new NotFoundException('Product 00000000 not found'));
    });
  });

  describe('listOfAuthor', () => {
    it('returns the requested page of the author reviews', async () => {
      repository.findPageOfAuthor.mockResolvedValue({
        items: [review],
        totalItems: 1,
      });

      const page = await service.listOfAuthor(7, { page: 1, limit: 20 });

      expect(repository.findPageOfAuthor).toHaveBeenCalledWith(7, {
        page: 1,
        limit: 20,
      });
      expect(page.data).toEqual([review]);
    });

    it('throws a not found error for an unknown author', async () => {
      repository.findPageOfAuthor.mockResolvedValue(null);

      await expect(
        service.listOfAuthor(999, { page: 1, limit: 20 }),
      ).rejects.toThrow(new NotFoundException('Author 999 not found'));
    });
  });
});
