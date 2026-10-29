import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NoteSphere — Your campus, connected.",
  description:
    "A thoughtful home for your college notes. Discover, share and build your personal learning library.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
