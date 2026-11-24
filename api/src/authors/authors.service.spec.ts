import { NotFoundException } from '@nestjs/common';
import type { Mocked } from 'vitest';
import type { Author } from './author.js';
import { AuthorsRepository } from './authors.repository.js';
import { AuthorsService } from './authors.service.js';

const poha: Author = {
  id: 7,
  firstName: 'Poha',
  lastName: 'Kuxero',
  type: 'professional',
  reviewCount: 1,
};

describe('AuthorsService', () => {
  let repository: Mocked<AuthorsRepository>;
  let service: AuthorsService;

  beforeEach(() => {
    repository = { findPage: vi.fn(), findById: vi.fn() };
    service = new AuthorsService(repository);
  });

  describe('list', () => {
    it('returns the requested page with its metadata', async () => {
      repository.findPage.mockResolvedValue({ items: [poha], totalItems: 766 });

      expect(await service.list({ page: 1, limit: 20 })).toEqual({
        data: [poha],
        meta: { page: 1, limit: 20, totalItems: 766, totalPages: 39 },
      });
    });

    it('passes the author type filter on to the repository', async () => {
      repository.findPage.mockResolvedValue({ items: [], totalItems: 0 });

      await service.list({ page: 1, limit: 20, type: 'amateur' });

      expect(repository.findPage).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        type: 'amateur',
      });
    });
  });

  describe('getById', () => {
    it('returns the author', async () => {
      repository.findById.mockResolvedValue(poha);

      await expect(service.getById(7)).resolves.toBe(poha);
    });

    it('throws a not found error for an unknown id', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(
        new NotFoundException('Author 999 not found'),
      );
    });
  });
});
