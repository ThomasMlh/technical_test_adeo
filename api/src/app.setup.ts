import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { setupApiDocs } from './api-docs.js';

/** Application-wide configuration, shared by main.ts and the e2e tests. */
export function configureApp<T extends INestApplication>(app: T): T {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // query strings become typed DTOs, with their defaults
      whitelist: true,
      forbidNonWhitelisted: true, // an unknown parameter is a 400, not silently ignored
    }),
  );
  app.enableShutdownHooks();
  setupApiDocs(app);
  return app;
}
