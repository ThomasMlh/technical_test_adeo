import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AuthorsController } from './authors.controller.js';
import { AuthorsRepository } from './authors.repository.js';
import { AuthorsService } from './authors.service.js';
import { PostgresAuthorsRepository } from './postgres-authors.repository.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthorsController],
  providers: [AuthorsService, { provide: AuthorsRepository, useClass: PostgresAuthorsRepository }],
})
export class AuthorsModule {}
