# Product catalogue API

Read-only HTTP API over the product catalogue: **products**, their **reviews**, and the reviews' **authors**.

- Base URL: `http://localhost:3000` (change the port with `PORT`)
- Public: no authentication
- JSON only; every endpoint is a `GET`
- Interactive documentation: [`/docs`](http://localhost:3000/docs), OpenAPI document: [`/docs-json`](http://localhost:3000/docs-json)

## Run

From the repository root, with Node 22 (`nvm use`) and Docker running:

```bash
npm install   # installs database/ and api/
npm start     # starts PostgreSQL, applies migrations, loads the data, starts the API
```

That is all it takes to use the API. The API reads `DATABASE_URL` and `PORT` from the environment or from the `.env` at the repository root; see [Configuration](../README.md#configuration).

### Working on the API

To change the API's code, prepare the database alone (`npm run setup` in `database/`), then run the API from `api/`:

```bash
npm run start:dev   # restarts the API on every change
npm test            # unit and repository tests
npm run test:e2e    # end-to-end tests (in-process PostgreSQL, no Docker needed)
```

## Endpoints

| Method and path                                                      | Returns                                   |
| -------------------------------------------------------------------- | ----------------------------------------- |
| [`GET /products`](#get-products)                                     | Page of product summaries, sorted by name |
| [`GET /products/most-appreciated`](#get-productsmost-appreciated)    | Products with the most positive reviews   |
| [`GET /products/lowest-rated`](#get-productslowest-rated)            | Products whose average rating is below 3  |
| [`GET /products/{reference}`](#get-productsreference)                | One product, with its description         |
| [`GET /products/{reference}/reviews`](#get-productsreferencereviews) | Page of the product's reviews             |
| [`GET /reviews`](#get-reviews)                                       | Page of all reviews, most recent first    |
| [`GET /reviews/{id}`](#get-reviewsid)                                | One review                                |
| [`GET /authors`](#get-authors)                                       | Page of authors, sorted by name           |
| [`GET /authors/{id}`](#get-authorsid)                                | One author                                |
| [`GET /authors/{id}/reviews`](#get-authorsidreviews)                 | Page of the author's reviews              |

Products are identified by their business `reference` (e.g. `59033201`); reviews and authors by a numeric `id`.

## Conventions

### Pagination

Every list of a whole collection is paginated:

| Query parameter | Default | Allowed               |
| --------------- | ------- | --------------------- |
| `page`          | `1`     | integer ≥ 1           |
| `limit`         | `20`    | integer from 1 to 100 |

The response wraps the items with what is needed to fetch the others:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "totalItems": 250, "totalPages": 13 }
}
```

A page beyond `totalPages` returns an empty `data`. `meta.totalItems` is the size of the whole collection: `GET /reviews?limit=1` is the cheapest way to count reviews.

The two rankings (`most-appreciated`, `lowest-rated`) are short lists, not pages: they return a plain array and take only `limit` (default `5`, from 1 to 50).

### Errors

Errors share one shape:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Product 00000000 not found"
}
```

| Status            | When                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request` | A query parameter is invalid or unknown (`message` is then a list, one entry per problem), or an `id` is not an integer |
| `404 Not Found`   | The product, review or author does not exist                                                                            |

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["limit must not be greater than 100"]
}
```

Unknown query parameters are rejected rather than ignored, so a typo such as `?limt=5` does not go unnoticed.

### Formats

- `price` is a number in the unit given by `currency` (ISO 4217 code, e.g. `EUR`).
- `notation` is an integer from 1 to 5. `averageRating` is the average notation rounded to 2 decimals, `null` for a product without reviews.
- `reviewedAt` is an ISO 8601 date-time in UTC.
- Author `type` is `professional` or `amateur`.

## Products

A **product summary** is what lists return. It leaves out the long `description`, which only the detail endpoint returns.

| Field           | Type           | Description                                          |
| --------------- | -------------- | ---------------------------------------------------- |
| `reference`     | string         | Unique business reference                            |
| `name`          | string         |                                                      |
| `price`         | number         | Unit price, in `currency`                            |
| `currency`      | string         | ISO 4217 code                                        |
| `stock`         | integer        | Units in stock                                       |
| `reviewCount`   | integer        | Number of reviews                                    |
| `averageRating` | number \| null | Average notation, 2 decimals; `null` without reviews |

### `GET /products`

Page of product summaries, sorted by name. Query: [`page`, `limit`](#pagination).

```bash
curl "http://localhost:3000/products?page=1&limit=1"
```

```json
{
  "data": [
    {
      "reference": "76353879",
      "name": "Ad Duis occaecat Lorem quis officia magna est nulla Duis nostrud eiusmod deserunt nostrud ullamco",
      "price": 74.29,
      "currency": "EUR",
      "stock": 428,
      "reviewCount": 5,
      "averageRating": 3.4
    }
  ],
  "meta": { "page": 1, "limit": 1, "totalItems": 250, "totalPages": 250 }
}
```

### `GET /products/most-appreciated`

Products with the most **positive reviews**, a positive review being one with a notation strictly greater than 3. Products without any positive review are left out. Ties are broken on the average rating (higher first), then on the reference.

Query: `limit` (default `5`, max `50`). Each item is a product summary plus `positiveReviewCount`.

```bash
curl "http://localhost:3000/products/most-appreciated?limit=1"
```

```json
[
  {
    "reference": "92274450",
    "name": "Esse Duis laborum proident Duis Duis cupidatat esse quis et culpa quis in nisi sit deserunt dolor",
    "price": 920.91,
    "currency": "EUR",
    "stock": 313,
    "reviewCount": 5,
    "averageRating": 4.2,
    "positiveReviewCount": 5
  }
]
```

### `GET /products/lowest-rated`

Products whose **average rating is strictly below 3**, lowest first; ties are broken on the reference. Products without any review have no rating and are left out.

Query: `limit` (default `5`, max `50`). Each item is a product summary.

```bash
curl "http://localhost:3000/products/lowest-rated?limit=1"
```

```json
[
  {
    "reference": "16391318",
    "name": "Aute ut aute culpa laboris tempor labore qui id labore velit in labore Ut velit sint pariatur sint",
    "price": 470.21,
    "currency": "EUR",
    "stock": 292,
    "reviewCount": 1,
    "averageRating": 1
  }
]
```

### `GET /products/{reference}`

One product: its summary plus `description`. `404` when no product has this reference.

```bash
curl "http://localhost:3000/products/59033201"
```

```json
{
  "reference": "59033201",
  "name": "Non dolor minim ex veniam ipsum qui eiusmod velit est cupidatat in proident ipsum aliquip non labore",
  "price": 972.5,
  "currency": "EUR",
  "stock": 415,
  "reviewCount": 3,
  "averageRating": 4.33,
  "description": "Labore est dolor sed laborum id irure ullamco commodo voluptate proident in elit anim Duis tempor ..."
}
```

### `GET /products/{reference}/reviews`

Page of the product's [reviews](#reviews), most recent first. Query: [`page`, `limit`](#pagination). `404` when the product does not exist; an empty page when it has no reviews.

```bash
curl "http://localhost:3000/products/59033201/reviews?limit=1"
```

```json
{
  "data": [
    {
      "id": 1,
      "notation": 5,
      "comment": "Very practical and easy to use.",
      "reviewedAt": "2025-04-06T02:09:10.000Z",
      "productReference": "59033201",
      "author": {
        "id": 1,
        "firstName": "Poha",
        "lastName": "Kuxero",
        "type": "professional"
      }
    }
  ],
  "meta": { "page": 1, "limit": 1, "totalItems": 3, "totalPages": 3 }
}
```

## Reviews

A **review** embeds its author, and refers to its product by reference (fetch [`/products/{reference}`](#get-productsreference) for the product itself).

| Field              | Type    | Description                         |
| ------------------ | ------- | ----------------------------------- |
| `id`               | integer |                                     |
| `notation`         | integer | 1 to 5                              |
| `comment`          | string  |                                     |
| `reviewedAt`       | string  | ISO 8601 date-time, UTC             |
| `productReference` | string  | Reference of the reviewed product   |
| `author`           | object  | `{ id, firstName, lastName, type }` |

Lists of reviews are sorted most recent first; reviews of the same date are ordered by id, so pages never overlap.

### `GET /reviews`

Page of all reviews. Query: [`page`, `limit`](#pagination).

```bash
curl "http://localhost:3000/reviews?limit=1"
```

```json
{
  "data": [
    {
      "id": 196,
      "notation": 2,
      "comment": "Exceptional quality, worth every penny.",
      "reviewedAt": "2025-12-26T20:55:34.000Z",
      "productReference": "83765231",
      "author": {
        "id": 196,
        "firstName": "Faza",
        "lastName": "Bekanu",
        "type": "professional"
      }
    }
  ],
  "meta": { "page": 1, "limit": 1, "totalItems": 766, "totalPages": 766 }
}
```

### `GET /reviews/{id}`

One review. `400` when `id` is not an integer, `404` when no review has this id.

```bash
curl "http://localhost:3000/reviews/1"
```

```json
{
  "id": 1,
  "notation": 5,
  "comment": "Very practical and easy to use.",
  "reviewedAt": "2025-04-06T02:09:10.000Z",
  "productReference": "59033201",
  "author": {
    "id": 1,
    "firstName": "Poha",
    "lastName": "Kuxero",
    "type": "professional"
  }
}
```

## Authors

| Field         | Type    | Description                 |
| ------------- | ------- | --------------------------- |
| `id`          | integer |                             |
| `firstName`   | string  |                             |
| `lastName`    | string  |                             |
| `type`        | string  | `professional` or `amateur` |
| `reviewCount` | integer | Number of reviews written   |

### `GET /authors`

Page of authors, sorted by last name then first name.

| Query parameter | Description                           |
| --------------- | ------------------------------------- |
| `type`          | Optional: `professional` or `amateur` |
| `page`, `limit` | [Pagination](#pagination)             |

```bash
curl "http://localhost:3000/authors?type=professional&limit=1"
```

```json
{
  "data": [
    {
      "id": 305,
      "firstName": "Haxoja",
      "lastName": "Babijezehu",
      "type": "professional",
      "reviewCount": 1
    }
  ],
  "meta": { "page": 1, "limit": 1, "totalItems": 406, "totalPages": 406 }
}
```

### `GET /authors/{id}`

One author. `400` when `id` is not an integer, `404` when no author has this id.

```bash
curl "http://localhost:3000/authors/1"
```

```json
{
  "id": 1,
  "firstName": "Poha",
  "lastName": "Kuxero",
  "type": "professional",
  "reviewCount": 1
}
```

### `GET /authors/{id}/reviews`

Page of the [reviews](#reviews) written by the author, most recent first. Query: [`page`, `limit`](#pagination). `404` when the author does not exist.

```bash
curl "http://localhost:3000/authors/1/reviews"
```

```json
{
  "data": [
    {
      "id": 1,
      "notation": 5,
      "comment": "Very practical and easy to use.",
      "reviewedAt": "2025-04-06T02:09:10.000Z",
      "productReference": "59033201",
      "author": {
        "id": 1,
        "firstName": "Poha",
        "lastName": "Kuxero",
        "type": "professional"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalItems": 1, "totalPages": 1 }
}
```

## Design

- **One module per resource** (`products`, `reviews`, `authors`), each in three layers: a controller (HTTP only: routes, validation, OpenAPI), a service (business rules, such as what a positive review is), and a repository port with a PostgreSQL implementation. Services depend on the port, not on the database, so they are tested with a fake.
- **Explicit SQL** through a small `SqlClient` port (`pg` in production, PGlite in tests): every query is visible, and the rankings are plain SQL aggregates.
- **No over-fetching**: lists leave out long fields (product description), reviews refer to their product by reference instead of embedding it, and pages are cut before reviews are aggregated.
- Sub-resources (`/products/{reference}/reviews`, `/authors/{id}/reviews`) belong to the reviews module, so modules do not depend on each other.
