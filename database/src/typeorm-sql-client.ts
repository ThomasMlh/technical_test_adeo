import type { DataSource } from 'typeorm';
import type { SqlClient, TransactionalSqlClient } from './sql-client.js';

/** Adapts a TypeORM DataSource to the `TransactionalSqlClient` port. */
export class TypeOrmSqlClient implements TransactionalSqlClient {
  constructor(private readonly dataSource: DataSource) {}

  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({ query: (sql, parameters) => manager.query(sql, parameters) }),
    );
  }
}
