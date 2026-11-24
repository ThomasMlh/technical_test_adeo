# Front — Vue 3 dashboard

Phase 3 (bonus): an operational dashboard of the product catalog, built on the API of phase 2 (`../api`).

- Vue 3, Composition API only (`<script setup>`), TypeScript, Vite
- Vuetify for the UI components, with the library defaults

`pnpm bootstrap` at the repository root installs it with the rest of the project; `pnpm start` there starts it with the API, `pnpm start:front` alone. Inside `front/`:

```bash
pnpm dev     # http://localhost:5173
pnpm test    # unit tests (Vitest)
pnpm lint    # oxlint + ESLint
pnpm build   # type-check and production build
```

## What it shows

One page, each section loaded on its own: a section the API fails to answer shows an error, the others still show.

| Section                   | API call                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| Overview: totals          | `GET /products?limit=1` and `GET /reviews?limit=1`, read from `meta.totalItems` |
| Most appreciated products | `GET /products/most-appreciated?limit=5`: most reviews with a notation above 3  |
| Lowest-rated products     | `GET /products/lowest-rated?limit=5`: average notation below 3, lowest first    |
| Catalog                   | every page of `GET /products?limit=100`, shown in one table, without pagination |

## How it reaches the API

The front calls `/api/...`; the Vite server (dev and preview) forwards it to the API on `http://localhost:$PORT`, with the `PORT` of the root `.env` (3000 by default). No CORS setup and no API URL to configure.

## Structure

```
src/
├── api/
│   ├── catalog-api.ts      the calls the dashboard needs, over fetch
│   ├── catalog-api-key.ts  injection of the client: main.ts provides it, tests provide a fake
│   └── types.ts            response shapes of the API
├── composables/
│   └── useRequest.ts       runs a request, exposes its data, loading state and error
├── components/             display only: they render the props they are given
│   ├── DashboardSection.vue  titled section: loader, error or content
│   ├── KpiBar.vue
│   ├── ProductRanking.vue    card grid, used by both rankings
│   └── ProductCatalog.vue    table of every product
└── App.vue                 the page: wires each section to its request
```

Tests sit next to the code, in `__tests__/`: the API client against a fake `fetch`, the components with fixed props, and the page with a fake API client.

## Possible evolution

The data is read once and never changed, so plain requests are enough. With several pages, writes or periodic refreshes, a cache such as TanStack Vue Query would replace `useRequest`, without changing the components.
