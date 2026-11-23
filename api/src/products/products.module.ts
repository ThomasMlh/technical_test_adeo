import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PostgresProductsRepository } from './postgres-products.repository.js';
import { ProductsController } from './products.controller.js';
import { ProductsRepository } from './products.repository.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    // The service depends on the port; this line picks its PostgreSQL implementation.
    { provide: ProductsRepository, useClass: PostgresProductsRepository },
  ],
})
export class ProductsModule {}
