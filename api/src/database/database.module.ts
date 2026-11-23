import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PgSqlClient } from './pg-sql-client.js';
import { SqlClient } from './sql-client.js';

/** Same database as `database/` (phase 1) and its docker-compose service. */
const DEFAULT_DATABASE_URL = 'postgres://catalog:catalog@localhost:5432/catalog';

@Module({
  providers: [
    {
      provide: SqlClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new PgSqlClient(
          new Pool({ connectionString: config.get('DATABASE_URL') ?? DEFAULT_DATABASE_URL }),
        ),
    },
  ],
  exports: [SqlClient],
})
export class DatabaseModule {}
