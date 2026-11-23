# Phase 1 — PostgreSQL database

Local PostgreSQL, a normalised schema for `data/products.json`, and a seed.
This package is independent from the API: it owns the schema, the API only reads it.

## Run

Requires Node 22 (`nvm use` at the repository root) and Docker.

```bash
npm install
npm run setup     # starts PostgreSQL, applies migrations, loads data/products.json
npm run psql      # opens a SQL console on the database
npm test          # schema and seed tests (in-process PostgreSQL, no Docker needed)
```

Connection: `postgres://catalog:catalog@localhost:5432/catalog` (override with `DATABASE_URL`).

## PostgreSQL version

`docker-compose.yml` pins `postgres:18.7-alpine`. An upgrade is a deliberate, reviewed change:
Dependabot (`.github/dependabot.yml`) opens a pull request when a new image is released.
Schema changes go through versioned migrations (`src/migrations/`), recorded in the `migrations` table.

## Schema

```
products 1 ──< reviews >── 1 authors
```

| Table | Columns | Constraints |
|---|---|---|
| `products` | `id`, `reference`, `name`, `description`, `price numeric(12,2)`, `currency char(3)`, `stock` | `reference` unique; price ≥ 0; stock ≥ 0; currency is 3 upper-case letters |
| `authors` | `id`, `first_name`, `last_name`, `type author_type` | `type` ∈ {`professional`, `amateur`}; (first name, last name, type) unique |
| `reviews` | `id`, `product_id`, `author_id`, `notation smallint`, `comment`, `reviewed_at timestamptz` | notation 1–5; deleting a product deletes its reviews; an author with reviews cannot be deleted; foreign keys indexed |

Choices:
- Surrogate integer ids; `reference` stays the business key the API exposes.
- Integrity lives in the database (NOT NULL, CHECK, FK, UNIQUE), not only in application code.
- `numeric` for prices: no floating-point rounding.

Assumptions about the source data:
- Authors have no id in the source: an author is identified by first name, last name and type.
- Review dates have no timezone: they are read as UTC.

## Seed

`npm run seed` replaces the whole catalogue in one transaction (truncate, then one bulk insert per table),
so it can be run again at any time and leaves the previous data intact if anything fails.

- `normalizeCatalog` — pure function: nested JSON → one list per table, authors deduplicated.
- `PostgresCatalogWriter` — writes a normalised catalogue; depends on the small `SqlClient` port, not on TypeORM.
- `seed.ts` — composition root: reads the file, normalises, writes.
