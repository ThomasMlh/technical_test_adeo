/**
 * Port to the database: run one parameterised SQL statement, get its rows.
 * An abstract class so it is also the Nest injection token.
 */
export abstract class SqlClient {
  abstract query<Row = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<Row[]>;
}
