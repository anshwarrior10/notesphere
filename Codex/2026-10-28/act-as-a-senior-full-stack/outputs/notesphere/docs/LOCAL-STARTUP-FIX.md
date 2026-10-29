# Offline local startup repair

The previous launcher attempted a production build when source files changed. During verification Windows denied directory creation in Next.js build output (`EPERM`); a fresh build directory also encountered this restriction. The launcher now uses the standard Next.js development server with webpack, compiling pages on demand in a separate `.next-local` cache. It does not require a production build.

The local launcher explicitly disables remote database/storage credentials, SMTP and Next.js telemetry. It never downloads dependencies. This computer already has the required packages; a new computer needs a one-time `npm ci` installation before offline use.

It records startup output in `.data/local-launch.log`, identifies its own running instance before reusing it, and reports readiness failures instead of silently waiting forever. Database and uploaded files are preserved.

Verified using `node scripts/test-launcher.mjs`: database/catalog readiness, home page HTTP 200, PDF worker availability, 20 MB local limit, protected-page sign-in redirect and a second launcher reusing the same server. This test disables browser auto-opening and shuts down its server afterward.

Important verification boundary: a server launched inside the assistant's execution environment answered its internal health check, while a separate command/browser connection to the same loopback address timed out. A browser-accessible host launch has not been verified. Launch `Open-NoteSphere.cmd` directly from Windows File Explorer and keep its command window open to run under your Windows account. No internet connection or cloud project is used.
