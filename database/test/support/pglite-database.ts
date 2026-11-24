import { PGlite } from '@electric-sql/pglite';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { catalogMigrations } from '../../src/migrations/index.js';
import type {
  SqlClient,
  TransactionalSqlClient,
} from '../../src/sql-client.js';

/**
 * An in-process PostgreSQL (PGlite, compiled to WebAssembly) for tests:
 * the real SQL engine, without Docker.
 */
export class PgliteDatabase implements SqlClient, TransactionalSqlClient {
  private constructor(private readonly db: PGlite) {}

  static async create(): Promise<PgliteDatabase> {
    return new PgliteDatabase(await PGlite.create());
  }

  static async createMigrated(): Promise<PgliteDatabase> {
    const database = await PgliteDatabase.create();
    for (const Migration of catalogMigrations) {
      await database.migrateUp(new Migration());
    }
    return database;
  }

  async query<Row = Record<string, unknown>>(
    sql: string,
    parameters?: unknown[],
  ): Promise<Row[]> {
    return (await this.db.query<Row>(sql, parameters)).rows;
  }

  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) =>
      work({
        query: async (sql, parameters) =>
          (await tx.query(sql, parameters)).rows as never,
      }),
    );
  }

  migrateUp(migration: MigrationInterface): Promise<unknown> {
    return migration.up(this.asQueryRunner());
  }

  migrateDown(migration: MigrationInterface): Promise<unknown> {
    if (!migration.down)
      throw new Error(`${migration.constructor.name} has no down()`);
    return migration.down(this.asQueryRunner());
  }

  close(): Promise<void> {
    return this.db.close();
  }

  /** Migrations only call `queryRunner.query()`; nothing else is needed. */
  private asQueryRunner(): QueryRunner {
    return {
      query: (sql: string) => this.db.exec(sql),
    } as unknown as QueryRunner;
  }
}
