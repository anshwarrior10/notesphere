import type { NextConfig } from "next";
const config: NextConfig = {
  distDir:
    process.env.NOTESPHERE_BUILD_DIR ||
    (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  serverExternalPackages: [
    "@electric-sql/pglite",
    "pg",
    "nodemailer",
    "file-type",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
