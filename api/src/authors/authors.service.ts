import { Injectable, NotFoundException } from '@nestjs/common';
import { type Page, toPage } from '../common/pagination/page.js';
import type { Author } from './author.js';
import { type AuthorCriteria, AuthorsRepository } from './authors.repository.js';

@Injectable()
export class AuthorsService {
  constructor(private readonly authors: AuthorsRepository) {}

  async list(criteria: AuthorCriteria): Promise<Page<Author>> {
    const { items, totalItems } = await this.authors.findPage(criteria);
    return toPage(items, totalItems, criteria);
  }

  async getById(id: number): Promise<Author> {
    const author = await this.authors.findById(id);
    if (!author) throw new NotFoundException(`Author ${id} not found`);
    return author;
  }
}
