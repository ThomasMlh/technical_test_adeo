import { DataSource } from 'typeorm';
import { databaseOptions } from './database-options.js';

/** Entry point of the TypeORM CLI (`npm run migrate`, `npm run migrate:revert`). */
export default new DataSource(databaseOptions());
