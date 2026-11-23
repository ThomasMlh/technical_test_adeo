import { NotFoundException } from '@nestjs/common';
import type { Mocked } from 'vitest';
import type { ProductDetails, ProductSummary } from './product.js';
import { ProductsRepository } from './products.repository.js';
import { ProductsService } from './products.service.js';

const drill: ProductSummary = {
  reference: '59033201',
  name: 'Drill',
  price: 972.5,
  currency: 'EUR',
  stock: 415,
  reviewCount: 2,
  averageRating: 4.5,
};

describe('ProductsService', () => {
  let repository: Mocked<ProductsRepository>;
  let service: ProductsService;

  beforeEach(() => {
    repository = {
      findPage: vi.fn(),
      findByReference: vi.fn(),
      findMostAppreciated: vi.fn(),
      findLowestRated: vi.fn(),
    };
    service = new ProductsService(repository);
  });

  describe('list', () => {
    it('returns the requested page with its metadata', async () => {
      repository.findPage.mockResolvedValue({ items: [drill], totalItems: 21 });

      const page = await service.list({ page: 2, limit: 20 });

      expect(repository.findPage).toHaveBeenCalledWith({ page: 2, limit: 20 });
      expect(page).toEqual({
        data: [drill],
        meta: { page: 2, limit: 20, totalItems: 21, totalPages: 2 },
      });
    });
  });

  describe('getByReference', () => {
    it('returns the product', async () => {
      const details: ProductDetails = { ...drill, description: 'A drill' };
      repository.findByReference.mockResolvedValue(details);

      await expect(service.getByReference('59033201')).resolves.toBe(details);
    });

    it('throws a not found error for an unknown reference', async () => {
      repository.findByReference.mockResolvedValue(null);

      await expect(service.getByReference('00000000')).rejects.toThrow(
        new NotFoundException('Product 00000000 not found'),
      );
    });
  });

  describe('mostAppreciated', () => {
    it('ranks on positive reviews, defined as a notation strictly greater than 3', async () => {
      repository.findMostAppreciated.mockResolvedValue([]);

      await service.mostAppreciated(5);

      expect(repository.findMostAppreciated).toHaveBeenCalledWith({
        positiveNotationAbove: 3,
        limit: 5,
      });
    });
  });

  describe('lowestRated', () => {
    it('only keeps products whose average rating is strictly below 3', async () => {
      repository.findLowestRated.mockResolvedValue([]);

      await service.lowestRated(5);

      expect(repository.findLowestRated).toHaveBeenCalledWith({
        averageRatingBelow: 3,
        limit: 5,
      });
    });
  });
});
