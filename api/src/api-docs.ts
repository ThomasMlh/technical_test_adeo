import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * OpenAPI documentation, generated from the controllers and DTOs:
 * interactive page at /docs, raw document at /docs-json.
 */
export function setupApiDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Product catalog API')
    .setDescription(
      'Read-only access to the product catalog: products, their reviews and the reviews’ authors. ' +
        'Public, no authentication. Lists are paginated with `page` and `limit`; ' +
        'errors are `{ statusCode, error, message }`.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
