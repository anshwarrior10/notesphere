# Verified portal tests

Executed 2026-10-28T21:18:49.576Z against an isolated local Next.js development server and on-disk PostgreSQL (PGlite). No cloud project or live user database was used.

- PASS: Separate admin/student sign-up and sign-in pages retain NoteSphere styling
- PASS: Student registration cannot self-assign administrator privileges
- PASS: Portal sign-in checks the account role and password
- PASS: All four named demo students can sign in to their own accounts
- PASS: Admin account creation requires an expiring single-use invitation
- PASS: Guests cannot search, inspect, download or upload notes; students cannot use admin APIs
- PASS: Students can complete their profiles without changing role
- PASS: Admin uploads reject disguised executables and genuine non-PDF documents
- PASS: Student upload pages are available with review guidance and My uploads navigation
- PASS: Student PDFs stay pending with owner/admin preview and cannot bypass approval
- PASS: Rejected student notes remain hidden and their uploader receives the decision
- PASS: Student drafts submit for approval and approval never exposes private PDFs
- PASS: Admin PDF publication immediately delivers to all four student portals
- PASS: Only authenticated students/admins can preview and download published PDF bytes
- PASS: Private PDFs and unpublished drafts are withheld from students
- PASS: Duplicate PDF uploads and forged cross-site mutations are rejected
- PASS: Student bookmarks and private collections persist with enforced ownership
- PASS: Student reviews update ratings and notify the uploading admin
- PASS: The admin roster identifies all four named demo students
- PASS: Content reports, review deletion and collection cleanup remain functional
- PASS: Password reset remains single-use and revokes old administrator sessions

These HTTP/database assertions do not establish browser rendering or cloud/email delivery. Demo passwords are randomized inside this isolated test database; application passwords are stored only as hashes.
