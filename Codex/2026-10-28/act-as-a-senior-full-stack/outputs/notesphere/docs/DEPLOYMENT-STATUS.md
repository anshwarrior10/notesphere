# Deployment handoff

## Local application

The user requested a localhost start-command fallback. `Start-NoteSphere.cmd` now launches the local development server, automatically selects a free port and opens the browser when the database is ready. A launcher smoke test passed: local server startup, catalog/database readiness, landing HTML, PDF worker availability, 20 MB local file limit and protected-page sign-in redirect. The local launcher explicitly disables remote database and cloud-storage credentials.

Source implementation and SQL schema are present in this project. The latest moderation update passed TypeScript checks, four unit tests and 21 multi-assertion HTTP integration checks against an isolated development server. A production build was not rerun for this update. npm reported zero known production dependency vulnerabilities at the time checked. See TEST-RESULTS.md for the actual integration run.

The browser preview could not be verified in this execution environment: the separate browser/local-tool connection to loopback failed, and the persistent Node runtime reported `connect EACCES 127.0.0.1`. This is a verification limitation; no browser rendering or PDF-canvas success is claimed from HTTP byte checks alone.

## Vercel

The Vercel connection is present, but an attempt to create the new `notesphere` project returned a 403 team-scope authorization error. No successful project creation or deployment result has been received. Vercel requested authorization for the connection to access the selected `notesharing` team. Team access must be completed before retrying the new-project creation.

## Database and storage

The user explicitly required that BYG remain untouched and chose to connect a different Supabase organization. No schema migrations, inserts, storage changes, deployments or other writes have been made to BYG. Do not use BYG for later setup.

Await confirmation of the separately connected organization. Then select that organization, check its actual project cost and obtain any required cost confirmation, create a dedicated NoteSphere project, configure the PostgreSQL connection/private bucket, apply the migration and configure Vercel environment variables. Do not infer that a newly visible connection is approved for an unrelated existing project.

## Email

SMTP credentials/sender have not been configured or tested. The reset-token backend has been tested; delivery of a real email has not.
