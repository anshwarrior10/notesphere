# Testing plan and cases

## Automated commands

`npm test` runs isolated security/validation tests. `npm run build` compiles the production application. `npm run test:flows` launches an isolated development server on port 3101 and runs actual API journeys against a separate PostgreSQL directory. `npm run typecheck` checks TypeScript. `npm audit --omit=dev` checks known production dependency advisories.

Current role-specific results are recorded in [TEST-RESULTS.md](TEST-RESULTS.md): student submissions held pending, approval/rejection permissions and notifications, delivery to all four demo students, invitation-based admin registration and authenticated student access. The current permission model is in [ROLE-PORTALS.md](ROLE-PORTALS.md).

`node scripts/test-launcher.mjs` separately verifies the local launcher, database/catalog readiness, landing response, PDF worker, local file limit and sign-in redirect. Browser auto-opening is disabled during that smoke test. Next.js can stream a redirect inside a 200 HTML response after a loading boundary; the check accepts either a 307 Location redirect or the corresponding streamed sign-in redirect.

## Core journey acceptance matrix

| ID | Action | Expected result |
| --- | --- | --- |
| T01 | Register two students | Distinct persisted profiles and session cookies |
| T02 | Enter wrong password | 401, generic credential error |
| T03 | Edit academic profile | New values persist and appear in current profile |
| T04 | Upload valid PDF | Note/file metadata stored; pending moderation |
| T05 | Upload executable renamed PDF | 400 and no note created |
| T06 | Upload same bytes twice | 409 for same contributor |
| T07 | Another student reads pending file | 404, no file bytes disclosed |
| T08 | Student calls admin endpoints | 403 for GET and POST |
| T09 | Administrator approves note | Approved metadata discoverable; owner notified |
| T10 | Search text + subject + semester | Correct matching note and result total |
| T11 | Search by tag/uploader | Correct real database results |
| T12 | Authorized preview/download | PDF bytes accessible; view deduplication and download count |
| T13 | Bookmark repeatedly | Exactly one persistent bookmark |
| T14 | Create collection and add note | Owned collection persists and contains note |
| T15 | Another student changes collection | 404; original collection unchanged |
| T16 | Owner reviews own upload | 403 |
| T17 | Student writes then edits review | One review remains; average changes immediately |
| T18 | Uploader reads notifications | Review notification present |
| T19 | Log out and reuse old cookie | User becomes null; old session is revoked |
| T20 | Log back in | Bookmarks and collection persist |
| T21 | Approve private note | Still unavailable to another student |
| T22 | Report review; admin resolves | Report visible to admin, disappears from open reports |
| T23 | Delete own review | Rating and count recomputed to zero if last review |
| T24 | Rename/delete collection | Membership removed without deleting source document |
| T25 | Submit password reset twice | First succeeds, second fails; existing sessions revoked |
| T26 | Another student deletes note | 403 |
| T27 | Owner deletes note | Document removed and dependent records cascade |
| T28 | Forged cross-site mutation | 403 regardless of valid session |

Several assertions are grouped into one named integration check. The generated report contains the actual executed checks and timestamp.

## Browser/manual validation

At desktop, tablet and phone widths: verify navigation, layout overflow, sidebar collapse/mobile menu, theme, form errors and keyboard focus. In an authenticated note page: verify PDF canvas, page navigation, zoom, fit width, full screen, loading/error fallback and download. Verify upload progress/cancel/retry, collection interactions, ratings and toasts visually. Inspect the console for errors and use an actual multi-page PDF for paging. Verify Office fallback separately.

SMTP tests need a configured mail service. Cloud Storage tests need a dedicated project with a private bucket. Vercel tests need an actual Ready deployment with the database/storage environment configured. No local automated result substitutes for these external checks.

## Test data and isolation

The HTTP test uses generated files, random passwords and `.invalid` email addresses in a dedicated test-only database directory. It never signs into or changes BYG or any remote project. Do not run scripts against a real user database by substituting credentials into test fixtures. Temporary test data stays outside the distributable application.
