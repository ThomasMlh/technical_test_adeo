# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Adeo fullstack technical test (statement in `INSTRUCTIONS.md`): the catalog of `data/products.json` in a local PostgreSQL (`database/`), exposed by a NestJS API (`api/`), with a Vue 3 + Vuetify dashboard (`front/`). pnpm workspace with these three packages; the database package is named `catalog-database`.

## Commands

Node 26 from `.nvmrc` (`nvm use`), pnpm 12 (pinned by `packageManager`), Docker for PostgreSQL.

```bash
pnpm bootstrap      # once: install, start PostgreSQL, migrate, seed
pnpm start          # API (:3000, docs at /docs) and front (:5173) together; start:api / start:front alone
pnpm start:dev      # same, API in watch mode
pnpm test           # format check + every package's tests + API e2e; needs no Docker
pnpm format         # Prettier, single root config, 80 columns: run before committing
pnpm db:migrate     # apply pending migrations; db:reset reloads the seed; db:start / db:stop
```

Per package (`pnpm --filter <api|front|catalog-database> <script>`, or from inside the folder):

- api: `test` (unit, `*.spec.ts`), `test:e2e` (`test/*.e2e-spec.ts`), `lint` (oxlint), `build`
- front: `test`, `type-check` (vue-tsc), `lint` (oxlint + ESLint), `build`
- catalog-database: `test`, `typecheck`, `migrate`, `migrate:revert`, `seed`, `psql`

Single test: `pnpm --filter api exec vitest run src/products/products.service.spec.ts` (add `-t "<name>"` for one case; e2e files need `--config vitest.config.e2e.ts`).

Never name a package script `setup`: `pnpm setup` is a pnpm builtin that edits the shell rc file.

## Architecture

**Database (`database/`)**: TypeORM is used only for migrations (`src/migrations/`), applied by a custom `src/migrate.ts` (the TypeORM CLI logs every SQL statement); no entities. Schema: `products 1──< reviews >──1 authors`, surrogate ids, `products.reference` unique, integrity enforced by CHECK constraints, an `author_type` enum and foreign keys (cascade from products, restrict from authors). Source authors have no id: an author is identified by first name + last name + type. Review dates have no timezone and are read as UTC. The seed is a pure `normalizeCatalog` plus a writer that truncates and bulk-inserts (`unnest`) in one transaction, through a `SqlClient` port.

**API (`api/`)**: NestJS, ESM, so relative imports end in `.js`. One module per resource (products, reviews, authors), each split into controller → service → repository port (an abstract class used as the injection token) → PostgreSQL adapter written in explicit SQL over the `SqlClient` port (`src/database/`, a `pg` Pool). Lists are paginated (`page`, `limit` ≤ 100, response `{ data, meta: { page, limit, totalItems, totalPages } }`). Query parameters are class-validator DTOs; the global `ValidationPipe` rejects unknown parameters with a 400. `src/app.setup.ts` holds the app-wide configuration shared by `main.ts` and the e2e tests. OpenAPI is generated from the code (`/docs`, `/docs-json`). `@nestjs/config` reads the root `.env`.

**Front (`front/`)**: calls `/api/...`, which the Vite server forwards to the API on the root `.env` `PORT` (no CORS). `src/api/catalog-api.ts` is the only code that talks HTTP; it is provided in `main.ts` and injected (`useCatalogApi`), so tests provide a fake. `useRequest` tracks one request's data, loading state and error; each dashboard section loads and fails on its own. Components only render props. The statement requires Composition API only and Vuetify defaults: no custom styling. Vuetify 4 uses MD3 typography classes (`text-headline-medium`, not `text-h4`).

**Tests** are written before the code. SQL is tested against PGlite (in-process PostgreSQL) with the real migrations: `catalog-database/testing` exports `PgliteDatabase`, used by the database tests, the API repository tests and the API e2e tests (Supertest, with `SqlClient` overridden by PGlite; fixtures in `api/test/support/`). Front tests mount components with Vuetify (`src/__tests__/mount-with-vuetify.ts`); Vitest needs `server.deps.inline: ['vuetify']`.

## Conventions

- All project text (code, comments, docs, UI) in American English: catalog, normalize.
- Commits: conventional `type(scope): message` in English, small and logical; no `Co-Authored-By` or AI attribution. Branches `type/short-name`, one per feature, from `main`; a fix unrelated to the current branch gets its own branch from `main`.
- Show the commits to the user before any push; the user opens and merges the pull requests.
- API documentation lives in `api/README.md` (every endpoint, with examples) and must follow API changes.
