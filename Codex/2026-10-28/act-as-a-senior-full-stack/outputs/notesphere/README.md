# NoteSphere

**Your College Notes, All in One Place.** A functional college notes-sharing application with a real database, secure authentication, private document storage, searchable notes and personal libraries.

## Quick start

### Admin and student portals

- `/admin/login` and `/admin/register`: administrator sign-in and invitation-based account creation; `/admin` is the admin page.
- `/student/login` and `/student/register`: student sign-in and open student account creation; `/student` is the student page.
- Students and administrators can upload PDFs. Student submissions remain pending until an administrator approves them; only their uploader and admins can preview pending files. Admin uploads publish immediately. Approved public PDFs notify students. Guests cannot search, inspect or download notes. Private notes and drafts remain restricted.
- Admin invitations are created in the admin page, expire after 24 hours and can be used once. A student registration request cannot assign an admin role.
- Local startup seeds the explicitly requested demo students **Sparsh Dwiwedi**, **Kundan Pathak**, **Shreshth Sharma** and **Aahaan Jain**, plus **NoteSphere Demo Admin**. They are marked as demo accounts. Credentials were supplied in the delivery chat; only password hashes are stored in `db/demo-accounts.sql` and the database. Demo seeds run only for embedded local PostgreSQL, never for an external/cloud database.
- A running local development server picks up the portal code on refresh; the local database applies the added schema and demo fixtures on the next database request. Existing accounts and uploads are preserved. Restart the local launcher if your server does not refresh.

Requires **Node.js 24 LTS** and npm. No cloud account or Docker is needed for local use.

**Windows: double-click `Start-NoteSphere.cmd`.** It starts the app in local development mode, finds a free local port and opens your browser. Pages compile locally as you open them; a production build is not needed for this launcher. A second launch reopens the existing instance. Keep the command window open; press Ctrl+C to stop. It forces embedded local PostgreSQL and private disk storage, so it never uses any configured cloud database or BYG. Your data persists under `.data/` between launches. The launcher runs offline and never installs packages; install dependencies once with `npm ci` if missing. Cloud services, SMTP and Next.js telemetry are disabled in this local mode. Startup errors are saved in `.data/local-launch.log`.

On macOS/Linux: `sh Start-NoteSphere.sh`. The manual commands below allow normal environment-based configuration instead.

```powershell
cd outputs/notesphere
npm ci
Copy-Item .env.example .env.local
npm run db:migrate
npm run dev
```

Open **http://127.0.0.1:3000**. Choose the student or admin portal. The database initializes automatically if you skip `db:migrate`. Local mode includes the requested demo accounts and editable sample academic taxonomy, but no fabricated notes, reviews or statistics. Students submit PDFs for administrator approval; administrators can also publish PDFs directly. Students receive and organize approved notes.

For a production build on your own machine:

```sh
npm run build
npm start
```

Keep `APP_URL` equal to the exact origin you use, including scheme and port. Production session cookies require HTTPS, with an explicit exception for HTTP on localhost/127.0.0.1. The local launcher sets the matching origin automatically. Do not run multiple app processes against one PGlite directory. Development output uses `.next-dev/`; production uses `.next/`.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide icons, accessible custom UI components, Zod, PostgreSQL, `pg`, PGlite for embedded local PostgreSQL, PDF.js, Node scrypt password hashing, opaque database sessions, Nodemailer and optional Supabase private Storage. The app uses its own secure authentication; it does **not** use Supabase Auth. Recommendations use course and semester matching, not AI.

## Implemented features

- Responsive landing page, registration/login/recovery screens, dashboard, Explore/search, note details, upload, My uploads, bookmarks, library, profile/settings, notifications, admin console, error and 404 screens.
- Salted scrypt password hashes; hashed random session/reset tokens; HttpOnly cookies; logout revocation; atomic single-use reset tokens that revoke existing sessions; server authorization and origin checks; persistent rate limiting.
- Profile editing and small PNG/JPEG/WebP avatars, course, department, college, semester and interests.
- Data-driven dashboard statistics, recent uploads, course/semester recommendations, top-rated/popular notes, reading history, saved notes, and real activity notifications.
- Debounced full-text search across title/description/topic, plus subject/course/tags/uploader matching; combined academic/file/rating/date/approval filters; removable chips; sorting; result counts; grid/list presentation; pagination.
- Student/admin drag/drop PDF uploads, server content/signature validation, size limits, progress/cancel/retry, selected PDF preview, duplicate hashes, private notes and drafts. Student notes require admin approval before classmates can access them; approval or rejection notifies the uploader. Published community PDFs notify all students.
- Authorized PDF.js preview with page controls, zoom, fit width, full screen, errors and download. Previously uploaded Office documents retain a download fallback; new uploads accept PDFs only.
- One editable review per student per note, no self-reviews, rating aggregation, author deletion, reviewer timestamps/sorting, reports and uploader notifications.
- Persistent unique bookmarks; private collections with create/rename/delete/add/remove; library filters and history. Removing a collection never deletes its source notes.
- Admin-only user list, platform totals, upload moderation/removal, report resolution, review removal, and catalog additions.
- Light/dark theme, collapsible sidebar, responsive layouts, reduced-motion support, skeletons, errors, empty states and toast feedback.

## Project structure

```text
notesphere/
├── src/app/                 # App Router, global design tokens and route boundaries
│   ├── [[...slug]]/         # Page routing and server-side route protection
│   └── api/[...path]/       # Validated HTTP API with server-side authorization
├── src/components/          # Shell, auth, functional pages, UI primitives, PDF reader
├── src/lib/                 # Database, queries, storage, security, Zod schemas
├── db/                      # Idempotent initial migration and private storage setup
├── scripts/                 # Migration, admin assignment, PDF worker and HTTP tests
├── tests/                   # Password, validation, authorization and origin unit tests
├── docs/                    # Project report, API, architecture and verification results
├── public/                  # PDF.js worker only; user documents never live here
├── compose.yaml             # Optional external PostgreSQL for local development
├── vercel.json              # Vercel Next.js deployment configuration
└── .env.example             # Configuration reference; no credentials
```

## Database

With `DATABASE_URL` empty, actual embedded PostgreSQL persists under `.data/postgres/`. User documents persist under `.data/files/`. Back up both together. Stop the local server before running database maintenance or assigning an admin because PGlite is single-process.

For external PostgreSQL, create a **dedicated NoteSphere database**, configure the connection string, and run:

```sh
npm run db:migrate
```

Numbered SQL files under `db/` create the private `notesphere` schema, normalized relations, foreign keys, checks, indexes, full-text index, uniqueness constraints, administrator invitations and editable reference catalog. They enable deny-by-default RLS and revoke PUBLIC schema access. The trusted backend connects as the schema owner and applies per-request authorization. Browsers never receive SQL credentials. Runtime code does not perform migrations or demo seeding on external PostgreSQL.

Optional Docker PostgreSQL: set `POSTGRES_PASSWORD` in your terminal, run `docker compose up -d`, and set `DATABASE_URL=postgresql://notesphere:YOUR_PASSWORD@127.0.0.1:5432/notesphere`. Do not commit the password. Use a pooler URL appropriate to your provider for serverless deployment.

## Administrator account

Register a normal account first, stop the local app if using PGlite, then run:

```sh
npm run db:admin -- your-email@example.com
```

Restart the app and use Admin sign-in. The server reads the role from the database on each request; changing browser state or URLs does not grant access. There is no hardcoded authentication bypass. New administrator PDFs are approved immediately when published. Student uploads and submitted drafts enter the admin approval queue. Private notes remain private after approval. Rejected notes remain accessible only to their uploader and admins.

## Environment configuration

Copy `.env.example` to `.env.local` for local use. Configure these in your host’s secret settings for deployment:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Exact application origin, e.g. `https://notesphere.example.com`; used for origin checks and reset links |
| `DATABASE_URL` | Server-only PostgreSQL connection string; empty selects local PGlite |
| `DATA_DIR` | Local persistent database/files directory; defaults to `.data` |
| `SUPABASE_URL` | Optional cloud Storage project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only storage credential; never prefix with `NEXT_PUBLIC_` |
| `STORAGE_BUCKET` | Private bucket name; defaults to `notesphere` |
| `SMTP_HOST`, `SMTP_PORT` | Recovery email SMTP server/port, normally 587 or 465 |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP authentication and verified sender |

Recovery explicitly reports that SMTP needs configuration when it is absent. Reset links are never exposed in the API or written to application logs. Email delivery has not been verified without an SMTP service.

## Vercel deployment

See [the deployment guide](docs/DEPLOYMENT.md). Vercel requires hosted PostgreSQL plus private cloud Storage; embedded database/disk storage is intentionally blocked there. Cloud files use authorized, 60-second signed access instead of public storage URLs. Vercel uploads are capped at **4 MB** to fit the platform’s request-body limit; local/self-hosted uploads support **20 MB**. Larger hosted uploads need a future direct-to-storage flow with server validation after upload.

The existing BYG project must not be used, inspected further, or modified for this deployment. Use a separate organization/account and dedicated NoteSphere resources. Deployment is not complete until credentials are configured, migrations succeed, the build is Ready, and the hosted app’s core flow is verified.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm run test:flows
npm audit --omit=dev
```

The integration script starts its own local development server on port 3101 with a separate `.next-role-tests` cache, creates isolated on-disk PostgreSQL data under `work/test-data/`, and exercises real role-specific HTTP routes using random test passwords. It does not touch your app database or require a production build. See [verified results](docs/TEST-RESULTS.md) and [test cases](docs/TESTING.md).

## Current boundaries and future work

- SMTP delivery, cloud Storage and external PostgreSQL require configuration and independent integration verification.
- No public Vercel deployment is claimed until verified; local tests do not prove hosted behavior.
- Helpful-review voting, contributor leaderboard, optional document cover-image upload, email verification, OCR/semantic search and advanced analytics are not implemented.
- The admin catalog supports adding departments/courses/subjects; editing/removal and arbitrary semester configuration are future work. Semesters are validated from 1 to 12.
- Recommendations match course/semester; profile interests are stored but not used to rank recommendations. Reading history records recently opened documents, not exact PDF scroll/page progress across devices.
- Note metadata cannot yet be edited after upload; owners can save drafts, submit them for approval or delete their own notes. Rejected notes need re-upload after correction.
- Add production malware scanning/content-disarm tooling for untrusted document ingestion at scale. Validation currently checks content signatures and rejects Office macro/embedded-object markers.
- Schedule retention/cleanup of expired sessions, reset tokens and rate-limit entries; cloud deletion failures can leave inaccessible orphan objects that need an operator cleanup job.
- Database/admin list pages currently cap at 100 entries; review lists cap at 100. These require pagination for larger production use.
- Institutional deployment needs operator contact details, approved privacy/retention terms, backups, observability and recovery drills.

For the college submission, see [PROJECT-REPORT.md](docs/PROJECT-REPORT.md).
