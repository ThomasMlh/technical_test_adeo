import { DataSource } from 'typeorm';
import { databaseOptions } from './database-options.js';

/** Entry point of the TypeORM CLI (`pnpm migrate:revert`). */
export default new DataSource(databaseOptions());
