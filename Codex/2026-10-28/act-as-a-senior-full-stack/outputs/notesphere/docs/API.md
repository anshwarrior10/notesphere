# NoteSphere API

All endpoints start with `/api`. JSON requests use `Content-Type: application/json`. Every mutation uses `POST` and requires an `Origin` header equal to `APP_URL` (or the actual request origin when no APP_URL is configured). Authentication uses an HttpOnly `ns_session` cookie. No API accepts a client-supplied user ID or role as authority.

Response errors are `{ "error": "human readable message" }`. Typical statuses: 400 validation, 401 unauthenticated, 403 unauthorized/origin, 404 unavailable resource, 409 duplicate, 413 too large, 429 throttled, 500 generic internal error, 503 missing SMTP. Valid creation responses use 201.

| Method | Path | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/config` | Public | Effective document size limit |
| GET | `/me` | Public | Current profile or null; no password/session hash |
| POST | `/register` | Public, throttled | `{name,email,password}`; create student and session |
| POST | `/login` | Public, throttled | `{email,password,portal}`; validate password and requested student/admin portal |
| POST | `/admin/register` | Public, throttled | `{name,email,password,inviteCode}`; consume a valid invitation and create an admin account |
| POST | `/admin/invites` | Admin | Create a single-use invitation valid for 24 hours; code returned once |
| POST | `/logout` | Student | Revoke current server session and delete cookie |
| POST | `/forgot-password` | Public, throttled | `{email}`; send expiring link when SMTP configured |
| POST | `/reset-password` | Public, throttled | `{token,password}`; atomically consume reset and revoke sessions |
| GET | `/catalog` | Public | Department, course and subject reference data |
| POST | `/profile` | Student | Update current student’s editable profile only |
| GET | `/notes` | Authenticated student/admin | Search accessible metadata with filters and pagination |
| GET | `/notes/:id` | Authenticated + readable note | Metadata, aggregated rating, reviews and related notes |
| GET | `/notes/:id/file` | Student + readable note | Private bytes locally; authorized 60-second cloud signed redirect |
| GET | `/notes/:id/file?download=1` | Student + readable note | Download and record event |
| POST | `/upload` | Student/admin, throttled | Validated PDF; student submissions become pending, admin publications become approved |
| POST | `/notes/:id/view` | Student + readable note | Record a view, deduplicated over 30 minutes |
| POST | `/notes/:id/bookmark` | Student + readable note | `{saved:boolean}`; idempotently save/remove |
| POST | `/notes/:id/review` | Student + readable note | `{rating:1..5,content}`; upsert own review; no self-review |
| POST | `/notes/:id/review` | Review author | `{action:"delete"}`; delete own review |
| POST | `/notes/:id/report` | Student + readable note | `{reason,review_id?}`; report note or associated review |
| POST | `/notes/:id/publish` | Note owner | Student draft becomes pending and notifies admins; admin draft publishes immediately |
| POST | `/notes/:id/delete` | Owner/admin | Delete note/file; cascade bookmarks, reviews and relations |
| GET | `/collections` | Student | Only current user’s collections with counts |
| POST | `/collections` | Student | `{name}`; create own named collection |
| POST | `/collections/:id` | Collection owner | `{note_id}` add; `{action:"remove",note_id}` remove |
| POST | `/collections/:id` | Collection owner | `{action:"rename",name}` or `{action:"delete"}` |
| GET | `/dashboard` | Student | Real aggregates, matching/recent/popular/saved/history/activity |
| GET | `/notifications` | Student | Only current user’s notifications |
| POST | `/notifications` | Student | Mark only own notifications read |
| GET | `/admin` | Admin | Usage counts, users, uploads and open reports |
| POST | `/admin` | Admin | Moderation/report/catalog actions described below |

## Search parameters

`q`, `subject`, `course`, `semester`, `college`, `branch`, `year`, `type` (MIME), `rating` (minimum), `days`, `status`, `collection`, `page`, `sort`, `mode`.

- Filters combine using AND. Page size is 12, with page bounded to 1..10000.
- `sort`: `relevant`, `recent`, `rating`, `views`, `downloads`, `bookmarks`, `title`, `saved`, `history`.
- `mode`: `uploads`, `bookmarks`, `history` require authentication. Collection filtering always requires collection ownership in the query; other users cannot enumerate its contents.
- `q` uses PostgreSQL `websearch_to_tsquery`, `ts_rank` and an indexed document vector for title/description/topic. Additional catalog, tag and uploader matching is case-insensitive. All dynamic values are bound parameters. Sort expressions are server allowlists.
- A public note must have `approved` status and `public` visibility, and requires sign-in. Owners can retrieve their own drafts, pending, rejected and private notes. Admin access is checked on detail/file routes; student discovery does not expose private notes.

Example:

```text
GET /api/notes?q=tree+traversal&subject=dsa&semester=3&rating=4&sort=rating&page=1
```

## Upload fields

`title`, `description`, `subject_id`, `course_id`, `branch`, `college`, `semester`, `topic`, `academic_year` (`YYYY-YYYY`), `language`, `visibility` (`public`/`private`), `status` (`pending`/`draft`), `tags` (comma-separated), `file`.

The browser’s MIME and extension are untrusted. The server checks content signatures and PDF header/EOF. Only PDF uploads from authenticated students or admins are accepted. Duplicate hashes are rejected for the same uploader. Non-draft student submissions are pending and notify admins. Admin submissions are approved immediately. Admin approval notifies the uploader and, for public notes, all students. Drafts cannot bypass submission through the moderation endpoint; repeating an existing decision returns 409. Size limits are 20 MB locally and 4 MB on Vercel. File keys are random IDs, independent of user-supplied names.

## Admin request bodies

```json
{"action":"moderate","id":"note UUID","status":"approved"}
{"action":"moderate","id":"note UUID","status":"rejected"}
{"action":"resolve","id":"report UUID"}
{"action":"remove-review","id":"review UUID"}
{"action":"catalog","kind":"subjects","name":"Algorithms","parent":"course ID"}
{"action":"catalog","kind":"courses","name":"B.Sc Computing","parent":"department ID"}
{"action":"catalog","kind":"departments","name":"Mathematics"}
```

Roles cannot be assigned by API clients. Student registration always creates a student. Admin registration requires an invitation issued by an existing administrator. The operator can also use the local admin assignment script with authorized database access. See [portal workflows](ROLE-PORTALS.md).
