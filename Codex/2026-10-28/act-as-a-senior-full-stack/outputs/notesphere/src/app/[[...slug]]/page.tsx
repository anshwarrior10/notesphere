import { redirect, notFound } from "next/navigation";
import { user } from "@/lib/security";
import { App } from "@/components/app";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const current = "/" + slug.join("/");
  const route = slug[0] || "";
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/student/login",
    "/student/register",
    "/admin/login",
    "/admin/register",
    "/forgot-password",
    "/reset-password",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const known = [
    "dashboard",
    "student",
    "explore",
    "search",
    "notes",
    "upload",
    "uploads",
    "bookmarks",
    "library",
    "profile",
    "notifications",
    "admin",
    "settings",
  ];
  if (
    !publicPaths.includes(current) &&
    (!known.includes(route) || (slug.length > 1 && route !== "notes"))
  )
    notFound();
  const u = await user();
  if (!publicPaths.includes(current) && !u)
    redirect(route === "admin" ? "/admin/login" : "/student/login");
  if (current === "/dashboard")
    redirect(u?.role === "admin" ? "/admin" : "/student");
  if (
    !publicPaths.includes(current) &&
    route === "admin" &&
    u?.role !== "admin"
  )
    redirect("/student");
  if (current === "/student" && u?.role === "admin") redirect("/admin");
  return <App key={u?.id || "guest"} initialUser={u} />;
}
