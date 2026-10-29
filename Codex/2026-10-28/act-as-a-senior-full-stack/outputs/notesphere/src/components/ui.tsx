"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  ArrowUpRight,
  FileText,
  Star,
  Eye,
  ArrowRight,
  SearchX,
  LoaderCircle,
  BookOpen,
  RefreshCw,
} from "lucide-react";
export const Context = createContext<{
  user: any;
  setUser: (u: any) => void;
  toast: (message: string, error?: boolean) => void;
}>({ user: null, setUser: () => {}, toast: () => {} });
export const useApp = () => useContext(Context);
export async function api(url: string, body?: any) {
  const res = await fetch("/api/" + url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export function useRemote(url: string | null) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    if (!url) {
      setData(null);
      setError("");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    api(url)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
export const date = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function Avatar({ user, size = 34 }: { user: any; size?: number }) {
  return user?.avatar ? (
    <img
      className="avatar"
      src={user.avatar}
      alt=""
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="avatar" style={{ width: size, height: size }}>
      {(user?.name || user?.uploader || "S")
        .split(" ")
        .map((s: string) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function Empty({
  title = "A little space for possibility.",
  text = "Your notes will feel right at home here.",
  action,
  href,
}: {
  title?: string;
  text?: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <BookOpen size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && href && (
        <Link className="btn primary" href={href}>
          {action}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: string;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <p>{error}</p>
      {retry && (
        <button className="btn" onClick={retry}>
          <RefreshCw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}
export function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="note-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel skeleton-card">
          <div className="skeleton" style={{ height: 120 }} />
          <div className="skeleton" style={{ height: 18, width: "80%" }} />
          <div className="skeleton" style={{ height: 14, width: "50%" }} />
        </div>
      ))}
    </div>
  );
}
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="rating">
      <Star size={13} fill={value ? "currentColor" : "none"} />
      {value ? Number(value).toFixed(1) : "Unrated"}
      {count !== undefined && <span className="muted">({count})</span>}
    </span>
  );
}
export function NoteCard({
  note,
  refresh,
}: {
  note: any;
  refresh?: () => void;
}) {
  const { user, toast } = useApp();
  const [saved, setSaved] = useState(!!note.bookmarked),
    [busy, setBusy] = useState(false);
  useEffect(() => setSaved(!!note.bookmarked), [note.bookmarked]);
  const save = async () => {
    if (!user) {
      location.href = "/login";
      return;
    }
    setBusy(true);
    try {
      await api(`notes/${note.id}/bookmark`, { saved: !saved });
      setSaved(!saved);
      toast(saved ? "Removed from bookmarks" : "Saved to your library");
      refresh?.();
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const colors = ["lavender", "mint", "peach", "blue"];
  const color =
    colors[
      note.subject_id
        .split("")
        .reduce((v: number, c: string) => v + c.charCodeAt(0), 0) % 4
    ];
  return (
    <article className="note-card">
      <Link
        href={"/notes/" + note.id}
        className={"note-art " + color}
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="paper">
          <div className="paper-kicker">{note.subject}</div>
          <strong>{note.title}</strong>
          <div className="paper-line" />
          <div className="paper-line short" />
          <div className="paper-line" />
          <div className="paper-line short" />
        </div>
        <span className="file-badge">
          <FileText size={12} />
          {note.mime === "application/pdf"
            ? "PDF"
            : note.mime?.includes("presentation")
              ? "PPTX"
              : "DOCX"}
        </span>
        <span className="art-corner">
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <div className="note-card-body">
        <div className="between">
          <span className={"subject-tag " + color}>{note.subject}</span>
          <button
            className={"icon-btn bookmark " + (saved ? "saved" : "")}
            aria-label={saved ? "Remove bookmark" : "Bookmark note"}
            disabled={busy}
            onClick={save}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <Link className="note-title" href={"/notes/" + note.id}>
          {note.title}
        </Link>
        <p className="card-description">{note.description}</p>
        <div className="inline note-author">
          <Avatar
            user={{ name: note.uploader, avatar: note.avatar }}
            size={23}
          />
          <span>{note.uploader}</span>
          <span className="author-dot">·</span>
          <span>Sem {note.semester}</span>
        </div>
        <div className="note-card-footer">
          <Rating value={note.rating} count={note.review_count} />
          <span className="inline muted">
            <Eye size={13} />
            {note.views}
          </span>
          {note.status !== "approved" && (
            <span className="status">{note.status}</span>
          )}
        </div>
      </div>
    </article>
  );
}
export function Section({
  title,
  sub,
  children,
  href,
  action = "View all",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {href && (
          <Link className="text-link" href={href}>
            {action}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Busy({ text = "Saving…" }: { text?: string }) {
  return (
    <>
      <LoaderCircle size={16} className="spin" />
      {text}
    </>
  );
}
