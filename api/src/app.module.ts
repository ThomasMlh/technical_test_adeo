import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthorsModule } from './authors/authors.module.js';
import { ProductsModule } from './products/products.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

/** The repository root `.env`, shared with docker compose and the database scripts (optional). */
const ROOT_ENV_FILE = resolve(import.meta.dirname, '../../.env');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ROOT_ENV_FILE }),
    ProductsModule,
    ReviewsModule,
    AuthorsModule,
  ],
})
export class AppModule {}
