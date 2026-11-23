/**
 * The smallest database surface the seeding code needs.
 * Depending on this port rather than on TypeORM keeps the seed testable
 * against any PostgreSQL (a real server, or PGlite in tests).
 */
export interface SqlClient {
  query<Row = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<Row[]>;
}

export interface TransactionalSqlClient {
  /** Runs `work` in one transaction: committed if it resolves, rolled back if it throws. */
  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T>;
}
