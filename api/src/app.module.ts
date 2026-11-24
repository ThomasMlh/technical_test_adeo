import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthorsModule } from './authors/authors.module.js';
import { ProductsModule } from './products/products.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProductsModule, ReviewsModule, AuthorsModule],
})
export class AppModule {}
