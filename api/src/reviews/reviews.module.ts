import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PostgresReviewsRepository } from './postgres-reviews.repository.js';
import { ProductReviewsController } from './product-reviews.controller.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsRepository } from './reviews.repository.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewsController, ProductReviewsController],
  providers: [ReviewsService, { provide: ReviewsRepository, useClass: PostgresReviewsRepository }],
})
export class ReviewsModule {}
