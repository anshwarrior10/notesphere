# Start NoteSphere locally

1. Open this output folder (or extract the complete project ZIP).
2. Double-click **Open-NoteSphere.cmd** beside the `notesphere` folder. On this computer, you may also copy just that launcher to your Desktop.
3. Leave its command window open. Your browser opens when the app is ready, usually at `http://127.0.0.1:3000`.
4. Choose **Student portal** or **Admin portal**. Use the demo credentials provided in this chat, or create a student account. Admin account creation requires a one-time invitation from an existing administrator.

Requires Node.js 24 LTS and installed dependencies. This computer already has both. The launcher runs offline in local development mode and reopens the existing instance when launched twice. It does not run a production build or download packages. On a different computer, install dependencies once with `npm ci`. The launcher chooses another local port if 3000 is busy. Press Ctrl+C in its window to stop it. Errors are recorded in `notesphere/.data/local-launch.log`.

This launcher forces local PostgreSQL and local private file storage. It does not connect to BYG or any cloud database. Accounts, uploaded documents, reviews and libraries persist in `notesphere/.data/`. Back up this directory; deleting it deletes your local data.

## Enable moderation for your demonstration

Local startup now includes the four requested demo students and a demo administrator; password hashes only are stored. Sign in through **Admin portal** to upload a PDF. All four students receive a notification and can read it after signing in. Students can also upload PDFs using **Upload a PDF**. Their notes remain pending until an admin approves them. Admins receive submission notifications; the uploader receives the approval or rejection decision. Guests cannot access notes.

To grant an additional account admin access through the operator command, register it, stop the local server, and run this inside `notesphere`:

```sh
npm run db:admin -- your-registered-email@example.com
```

Start the app again and use Admin sign-in. That account can publish PDFs or issue single-use admin invitations. Use a demo student to demonstrate delivery, preview, reviews and library persistence. Private notes remain private.

## Terminal alternative

```sh
cd notesphere
npm run local
```

For development with hot reload, use `npm run dev` instead. Standard run, environment and database instructions are in `notesphere/README.md`.

## Included

- Complete application source and dependency lockfile.
- Database SQL schema, private storage setup and catalog seed data.
- College project report with architecture, ER/use-case/data-flow diagrams.
- API reference, setup/deployment guide, testing plan and recorded test results.
- Windows start command and macOS/Linux launcher.

## Verification and remaining configuration

Current verification is recorded in `notesphere/docs/TEST-RESULTS.md`. The role and moderation journeys use an isolated local development server and database. TypeScript checking and four unit tests also pass. The separate browser preview was blocked by loopback permissions, so visual browser and PDF-canvas behavior remain unverified in this environment.

Vercel is not deployed: its team-access authorization and a separate Supabase organization/database still need setup. BYG has not been modified. SMTP recovery email delivery requires configuration; the reset-token backend was tested. Optional unimplemented enhancements are listed in the README.
