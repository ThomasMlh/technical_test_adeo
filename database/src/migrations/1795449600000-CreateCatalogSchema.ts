import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog schema, normalized from data/products.json:
 *
 *   products 1 ──< reviews >── 1 authors
 *
 * - Surrogate integer ids; `products.reference` stays the unique business key.
 * - Integrity is enforced by the database itself (NOT NULL, CHECK, FK, UNIQUE),
 *   so no client can store a notation of 6 or a negative stock.
 */
export class CreateCatalogSchema1795449600000 implements MigrationInterface {
  name = 'CreateCatalogSchema1795449600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE author_type AS ENUM ('professional', 'amateur');

      CREATE TABLE products (
        id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        reference   varchar(32)    NOT NULL,
        name        text           NOT NULL,
        description text           NOT NULL,
        price       numeric(12, 2) NOT NULL,
        currency    char(3)        NOT NULL,
        stock       integer        NOT NULL,
        CONSTRAINT products_reference_key UNIQUE (reference),
        CONSTRAINT products_price_check CHECK (price >= 0),
        CONSTRAINT products_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
        CONSTRAINT products_stock_check CHECK (stock >= 0)
      );

      CREATE TABLE authors (
        id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        first_name text        NOT NULL,
        last_name  text        NOT NULL,
        type       author_type NOT NULL,
        CONSTRAINT authors_identity_key UNIQUE (first_name, last_name, type)
      );

      CREATE TABLE reviews (
        id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id  integer     NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        author_id   integer     NOT NULL REFERENCES authors (id) ON DELETE RESTRICT,
        notation    smallint    NOT NULL,
        comment     text        NOT NULL,
        reviewed_at timestamptz NOT NULL,
        CONSTRAINT reviews_notation_check CHECK (notation BETWEEN 1 AND 5)
      );

      -- PostgreSQL does not index foreign keys by itself.
      CREATE INDEX reviews_product_id_idx ON reviews (product_id);
      CREATE INDEX reviews_author_id_idx ON reviews (author_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE reviews;
      DROP TABLE authors;
      DROP TABLE products;
      DROP TYPE author_type;
    `);
  }
}
