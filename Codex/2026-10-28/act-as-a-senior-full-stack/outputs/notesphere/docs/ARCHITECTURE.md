# NoteSphere implementation plan

1. Architecture: Next.js App Router, React/TypeScript, Tailwind, Lucide; Node API with Zod validation. PostgreSQL via pg in production; actual embedded PostgreSQL via PGlite for zero-service local use. A single Next process owns the embedded database. Production uses external PostgreSQL.
2. Design: indigo and stone palette, editorial typography, collapsible sidebar, responsive card grids, dark theme, accessible labels and toasts. Routes: /, /login, /register, /forgot-password, /reset-password, /dashboard, /explore, /search, /notes/:id, /upload, /uploads, /bookmarks, /library, /profile, /notifications, /admin, /settings.
3. Identity: scrypt password hashes, opaque random session cookies with hashed tokens in DB, HttpOnly/SameSite=Lax/Secure in production, server identity/ownership checks, origin validation on mutations, DB-backed throttles, atomic single-use password reset and session revocation.
4. Documents: authenticated uploads, 20 MB maximum, content signature checks, ZIP inspection for Office documents, private disk storage outside public/, SHA-256 duplicate detection, owner-only drafts/private notes, moderation approval, authorized streaming. PDF.js renders local PDFs in canvas.
5. Data: normalized academic catalog, notes and file metadata, tags, reviews, bookmarks, collections, events, notifications and reports. Constraints enforce ownership relationships and uniqueness. SQL full-text ranking and conjunctive search filters with bounded pagination.
6. Delivery: implement UI and API, exercise two-account workflows and authorization with HTTP integration checks, compile production build, document results accurately. Only the four explicitly requested demo students and a demo administrator are seeded locally, marked as demo accounts. No fabricated notes, reviews or activity. Reference catalog seeds are identified as editable sample taxonomy.

## Boundaries

The SQL database is private to the backend; browsers have no SQL credentials or direct data API. Authorization is enforced in every API operation. Production should use a least-privilege runtime DB role and TLS. Local files require a persistent volume; ephemeral/serverless deployment requires a cloud-storage adapter. No public file directory is served.
