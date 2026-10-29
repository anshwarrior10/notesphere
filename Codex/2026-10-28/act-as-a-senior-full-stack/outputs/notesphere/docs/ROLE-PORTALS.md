# Administrator and student workflows

This update keeps the original NoteSphere palette, illustrations, sidebar, cards and dark theme.

| Audience | Create account | Sign in | Dashboard |
| --- | --- | --- | --- |
| Student | `/student/register` | `/student/login` | `/student` |
| Administrator | `/admin/register` with invitation | `/admin/login` | `/admin` |

Students upload PDFs from **Upload a PDF** or **My uploads**. A submission is stored as **pending** and notifies admins; its uploader can preview it while waiting. Admins review the PDF and approve or reject it in the admin workspace. Approval makes public notes searchable and readable by classmates, and notifies students. Rejection keeps the note hidden and notifies its uploader. Students cannot set their own approval status or call administrator APIs.

Administrators can also upload and publish PDFs immediately. Draft submission by a student always enters the pending queue; drafts cannot be directly approved. Private PDFs remain visible only to their uploader and admins, even after approval. Anonymous visitors cannot access note metadata, search or document bytes. These controls are enforced by the backend, not just the navigation.

Administrator account creation uses a one-time code from the **Invite an admin** control on the admin dashboard. Codes expire after 24 hours, are stored only as hashes and are consumed atomically during account creation. Open student registration always creates a student, including when a forged request supplies an admin role. Portal sign-in validates the account's actual database role.

## Requested local demo accounts

| Name | Email | Role |
| --- | --- | --- |
| Sparsh Dwiwedi | sparsh.dwiwedi@notesphere.test | Student |
| Kundan Pathak | kundan.pathak@notesphere.test | Student |
| Shreshth Sharma | shreshth.sharma@notesphere.test | Student |
| Aahaan Jain | aahaan.jain@notesphere.test | Student |
| NoteSphere Demo Admin | admin@notesphere.test | Administrator |

Passwords were randomly generated and supplied only in the delivery chat. The database and seed file contain salted scrypt hashes. Local startup inserts these accounts idempotently; existing accounts with the same email are not overwritten. The sample accounts are marked **Demo** in the admin roster. No uploaded notes, ratings or reviews are fabricated.

Numbered migration `002_role_portals.sql` adds invitation storage and the demo flag. The local database applies it automatically, including when an existing connection is reused during development. External databases require `npm run db:migrate`; they never automatically receive demo fixtures. BYG is not accessed.

## API additions and changes

- `POST /api/admin/invites`: administrator only; returns a one-time code once.
- `POST /api/admin/register`: name/email/password/inviteCode; creates an admin only with a valid invitation.
- `POST /api/login`: optional `portal` value (`admin` or `student`) must match the account role.
- `POST /api/upload`: signed-in student/admin; PDF only. Student submissions become pending regardless of client role claims; admin publications are approved immediately.
- `POST /api/notes/:id/publish`: owners can submit drafts. Student drafts become pending and notify admins; admin drafts publish immediately.
- `POST /api/admin` with `action: "moderate"`: admins approve/reject submitted notes; the uploader is notified. Public approval delivers student notifications. Repeat identical decisions return 409 and do not resend notifications.
- `GET /api/notes` and note details/files require a valid session.

The visibility value `public` now means the registered student community, not the public internet. Bookmark, collection, profile and review ownership checks remain unchanged.

The latest isolated integration results are in `TEST-RESULTS.md`. This document and the updated README describe the current student-upload and administrator-approval model.
