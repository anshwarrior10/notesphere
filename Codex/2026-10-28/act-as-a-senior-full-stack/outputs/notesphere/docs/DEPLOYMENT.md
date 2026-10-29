# Deploy NoteSphere independently on Vercel

## Isolation

Do not use or modify BYG. Create a dedicated NoteSphere database project, private storage bucket and separate Vercel project. Never reuse another app’s user tables, storage or secrets.

## Hosted database and private storage

1. Select the separately connected Supabase organization/account. Review its current pricing before provisioning any paid resource.
2. Create a dedicated **NoteSphere** project and obtain its PostgreSQL connection string. For Vercel, use the provider’s pooler endpoint with TLS and the correct connection mode. Keep certificate validation enabled.
3. Set `DATABASE_URL` in `.env.local` temporarily and run `npm run db:migrate`. This creates the private `notesphere` schema. The API connects as that schema’s trusted owner; schema usage is not granted to public clients.
4. Run `db/supabase-storage.sql` in that project after the migration. It creates a **private** bucket. Do not make it public and do not add anonymous storage policies.
5. Obtain the project URL and server-only Storage service credential. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `STORAGE_BUCKET=notesphere`.
6. Verify upload/download/removal in this newly configured environment before relying on it. The service key is used only on the server, after application authorization.

## Create and deploy on Vercel

Import the source into a **new** Vercel project using the connected deployment tools or Vercel CLI. The project root is the folder containing `package.json` and `vercel.json`.

```sh
npx vercel login
npx vercel link
```

Set these server environment variables for Production and, if needed, a separately isolated Preview database:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STORAGE_BUCKET
APP_URL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
```

Use the Vercel secret environment settings; do not paste values into source files or commit them. `APP_URL` must be the final production origin. Preview deployments need their own matching origin or mutations will correctly fail origin validation.

```sh
npx vercel deploy --prod
```

Vercel detects Next.js. The install command runs `npm ci`, including the postinstall step that copies PDF.js’s worker into `public/`. `npm run build` builds with webpack. The app uses Node runtime, not Edge runtime. The configuration selects Mumbai (`bom1`); adjust to your database’s region if needed.

## Verify the deployment

- Confirm Ready state and successful build logs.
- Open `/` and verify the actual host URL.
- Register two test students, edit their profiles, and upload a small original PDF.
- Assign an admin using `npm run db:admin -- email` against this dedicated external database, then approve the note.
- Discover and preview the PDF as the second student, save it in a collection, review it, then verify uploader notifications and aggregates.
- Confirm private documents and admin endpoints deny unauthorized access.
- Log out/back in and verify the library persists.
- Exercise password recovery using configured SMTP and verify email delivery.
- Remove only the dedicated test fixtures you created for this test.

## Limits

Vercel request/response body limits influence document handling. The app caps uploads at 4 MB on Vercel, and returns short-lived signed cloud-file redirects after authorization so files do not travel through a function response. Self-hosted local uploads allow 20 MB. Direct-to-storage upload tickets and resumable uploads are future work.

No Vercel deployment is claimed in the source documentation without a verified deployment result. See `DEPLOYMENT-STATUS.md` for the handoff state when provided.

## Official references

- [Vercel CLI deployments](https://vercel.com/docs/cli/deploy)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Supabase private file access](https://supabase.com/docs/guides/storage/serving/downloads)
- [PGlite filesystem support](https://pglite.dev/docs/filesystems)
