# Product catalogue

Adeo fullstack technical test ([statement](INSTRUCTIONS.md)): the product catalogue of `data/products.json`, stored in a local PostgreSQL and exposed by a NestJS API.

| Phase                                            | Folder                   | Documentation                                                                          |
| ------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| 1. PostgreSQL database: schema, migrations, seed | [`database/`](database/) | [database/README.md](database/README.md)                                               |
| 2. API: products, reviews, authors               | [`api/`](api/)           | [api/README.md](api/README.md), and [`/docs`](http://localhost:3000/docs) once started |

## Quick start

Requirements: Node 26 (LTS), pnpm (`npm install -g pnpm`) and Docker.

```bash
nvm use          # Node 26, from .nvmrc
pnpm bootstrap   # once: installs dependencies, creates the database, loads the data
pnpm start       # starts the API
```

The API answers on http://localhost:3000, e.g. http://localhost:3000/products/most-appreciated; its interactive documentation is at http://localhost:3000/docs.

| Command           | Effect                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm bootstrap`  | Once: installs dependencies, starts PostgreSQL, applies migrations, loads `data/products.json` |
| `pnpm start`      | Starts the API                                                                                 |
| `pnpm start:dev`  | Starts the API, restarting it on every code change                                             |
| `pnpm db:start`   | Starts PostgreSQL again, e.g. after a reboot (data is kept in a Docker volume)                 |
| `pnpm db:stop`    | Stops PostgreSQL                                                                               |
| `pnpm db:migrate` | Applies new migrations, e.g. after pulling a schema change                                     |
| `pnpm db:reset`   | Reloads the data from `data/products.json`                                                     |
| `pnpm test`       | Every test: format check, database, API unit and end-to-end (no Docker needed)                 |

## Configuration

Nothing to configure: the defaults match `docker-compose.yml`. To change a port or the database,
copy `.env.example` to `.env` at the root; it is read by docker compose, the API and the database scripts.

| Variable        | Default                                             |                                     |
| --------------- | --------------------------------------------------- | ----------------------------------- |
| `POSTGRES_PORT` | `5432`                                              | Port PostgreSQL is published on     |
| `DATABASE_URL`  | `postgres://catalog:catalog@localhost:5432/catalog` | Database of the API and the scripts |
| `PORT`          | `3000`                                              | Port of the API                     |
| `CATALOG_FILE`  | `data/products.json`                                | Catalogue loaded by the seed        |

## Structure

```
├── INSTRUCTIONS.md         test statement
├── data/products.json      source catalogue
├── .env.example            optional configuration
├── docker-compose.yml      PostgreSQL 18.7, pinned
├── database/               phase 1: migrations, seed and their tests
├── api/                    phase 2: NestJS API
│   └── src/
│       ├── products/       controller → service → repository port → PostgreSQL adapter
│       ├── reviews/
│       ├── authors/
│       ├── common/         pagination
│       └── database/       SqlClient port and its pg implementation
├── pnpm-workspace.yaml     pnpm workspace: database/, api/
└── package.json            bootstrap / start / test / stop for the whole project
```

## Main choices

- **Database**: PostgreSQL in Docker Compose with a pinned image; Dependabot proposes upgrades. Schema as versioned migrations: `products 1──< reviews >──1 authors`, with integrity enforced in the database (checks, foreign keys, unique keys). See [database/README.md](database/README.md).
- **API**: one NestJS module per resource, each split into controller, service and repository port; explicit SQL; paginated lists; validated query parameters; OpenAPI generated from the code. See [api/README.md](api/README.md).
- **Tests**, written before the code: services against fake repositories, SQL against PGlite (an in-process PostgreSQL) with the real schema, and end-to-end tests of the real application.

## Assumptions about the data

- Authors have no id in the source: an author is identified by first name, last name and type.
- Review dates have no timezone: they are read as UTC.
