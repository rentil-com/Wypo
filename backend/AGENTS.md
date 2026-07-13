# Repository Guidelines

## Project Structure & Module Organization

This repository is a Node.js Express backend for a tool rental system. The entry point is `index.js`, which mounts feature routers and starts the server on port `3000`. Route modules are grouped by domain: `auth/` handles sessions, `accounts/` handles account routes, `katalog/` contains item, category, and review endpoints, and `actions/` contains favorites and rental actions. Each domain has thin mounting routers and separate files under `endpoints/`; reusable domain logic belongs in `helpers/` or `services/`. Cross-domain helpers and session/error middleware live in `shared/`. Database access is centralized in `db/pool.js` using `pg`. The database schema and seed/reference SQL live in `baza.sql`, while API behavior is documented in `ENDPOINTY.md`. There is currently no dedicated `tests/` directory.

## Build, Test, and Development Commands

- `npm install`: installs runtime dependencies from `package-lock.json`.
- `npm run dev`: starts the API with `nodemon index.js` for local development.
- `node index.js`: starts the API without file watching.
- `npm test`: currently exits with "no test specified"; add a real test runner before relying on this command in CI.

Create a local `.env` from `.env.example` before running the app. At minimum, configure `DATABASE_CONNECTION_URL`; S3-related variables are required for image upload and deletion endpoints.

## Coding Style & Naming Conventions

Use ES modules (`import` / `export`) and Express `Router()` modules for new endpoint groups. Keep route files domain-focused and mount them from `index.js`. Prefer `const` unless reassignment is required. Match nearby indentation; for new code, use 2 spaces and keep SQL template strings readable. Existing identifiers and response messages are mostly Polish, so keep new domain names, helper functions, and API errors consistent with that style, for example `parsujId`, `pobierzUzytkownikaZSesji`, or `wypozyczenia`.

## Testing Guidelines

No automated framework is configured yet. When adding tests, prefer endpoint-level tests with a test database and cover authentication, validation errors, database constraint handling, and S3 failure paths. Name tests after behavior, such as `items.add_photos.test.js`. Until a test runner exists, manually verify affected endpoints with HTTP requests and check database side effects.

## Commit & Pull Request Guidelines

Recent history uses short Polish commit summaries describing the changed behavior, for example `naprawa endpointu wypozyczenia` or `Dodano filtrowanie po nazwie i po cenie`. Follow that style: keep the first line concise and specific to the endpoint or feature.

Pull requests should include a short change summary, affected endpoints, database or environment changes, and manual test notes. Link related issues when available. Include screenshots or sample JSON responses when changing API output.

## Security & Configuration Tips

Do not commit real `.env` values or S3 credentials. Keep database queries parameterized with `$1`, `$2`, etc. Validate uploaded file types and sizes when touching image endpoints, and clean up S3 objects when database transactions fail.
