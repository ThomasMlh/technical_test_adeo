import type { OnApplicationShutdown } from '@nestjs/common';
import type { Pool } from 'pg';
import { SqlClient } from './sql-client.js';

/** `SqlClient` on a node-postgres connection pool, closed with the application. */
export class PgSqlClient extends SqlClient implements OnApplicationShutdown {
  constructor(private readonly pool: Pool) {
    super();
  }

  async query<Row = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<Row[]> {
    return (await this.pool.query(sql, parameters)).rows as Row[];
  }

  onApplicationShutdown(): Promise<void> {
    return this.pool.end();
  }
}
