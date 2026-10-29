"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  UploadCloud,
  FileText,
  Bookmark,
  Eye,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  FolderPlus,
  Folder,
  MoreHorizontal,
  Trash2,
  Download,
  Star,
  Flag,
  Clock,
  CheckCircle2,
  Bell,
  Settings,
  User,
  ShieldCheck,
  GraduationCap,
  LoaderCircle,
  Check,
  ExternalLink,
  ChevronLeft,
  Camera,
  Save,
  BookOpen,
  Grid2X2,
  List,
  RefreshCw,
} from "lucide-react";
import {
  useApp,
  api,
  useRemote,
  Avatar,
  NoteCard,
  Section,
  Empty,
  Skeleton,
  ErrorState,
  Rating,
  Busy,
  date,
} from "./ui";
import { BookIllustration } from "./app";
import { PdfViewer } from "./pdf-viewer";
export function Dashboard() {
  const { user } = useApp(),
    { data, loading, error, reload } = useRemote("dashboard");
  const admin = user?.role === "admin";
  const stats = [
    {
      label: admin ? "Notes uploaded" : "Available PDFs",
      value: admin ? data?.stats.uploads : data?.stats.available,
      icon: UploadCloud,
      color: "lavender",
      caption: admin
        ? "Knowledge you’ve shared"
        : "Approved notes from your campus",
    },
    {
      label: "Saved to library",
      value: data?.stats.bookmarks,
      icon: Bookmark,
      color: "peach",
      caption: "Ideas worth coming back to",
    },
    {
      label: "Learning moments",
      value: data?.stats.reads,
      icon: Eye,
      color: "blue",
      caption: "Your views & downloads",
    },
    {
      label: admin ? "Reviews received" : "Reviews written",
      value: admin ? data?.stats.reviews : data?.stats.reviews_given,
      icon: MessageSquare,
      color: "mint",
      caption: "Feedback that helps you grow",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            STUDENT PORTAL / YOUR PERSONAL LEARNING SPACE
          </div>
          <h1>
            Hey, {user?.name?.split(" ")[0]}.{" "}
            <span className="heading-muted">Stay curious.</span>{" "}
            <span className="wave">✳</span>
          </h1>
          <p>A new day, a fresh perspective. Let’s make a little progress.</p>
        </div>
        <Link href="/upload" className="btn primary">
          <Plus size={17} />
          Upload PDF
        </Link>
      </div>
      <section className="dashboard-banner">
        <div className="banner-copy">
          <span className="eyebrow">GOOD NOTES. GREAT POSSIBILITIES.</span>
          <h2>
            Your next breakthrough
            <br />
            could be <em>one note away.</em>
          </h2>
          <p>
            Explore what your campus is learning.
            <br />
            Find your spark. Share it forward.
          </p>
          <Link href="/explore" className="btn dark-btn">
            Find your next read
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <BookIllustration />
      </section>
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="between">
              <span>{s.label}</span>
              <span className={"stat-icon " + s.color}>
                <s.icon size={18} />
              </span>
            </div>
            <strong>{loading ? "—" : (s.value ?? 0)}</strong>
            <small>{s.caption}</small>
          </div>
        ))}
      </div>
      {error && <ErrorState error={error} retry={reload} />}
      <div className="dashboard-columns">
        <div>
          <Section
            title="Picked for your next chapter"
            sub="Notes matched to your course and semester."
            href="/explore"
          >
            {loading ? (
              <Skeleton count={2} />
            ) : data?.recommended.length ? (
              <div className="note-grid two">
                {data.recommended.slice(0, 2).map((n: any) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            ) : (
              <Empty
                title="Let’s make this space yours."
                text="Complete your academic profile to find notes for your course and semester."
                action="Personalize your profile"
                href="/profile"
              />
            )}
          </Section>
          <Section
            title="Fresh off the notebook"
            sub="The latest approved PDFs from your campus."
            href="/explore"
          >
            {loading ? (
              <Skeleton count={2} />
            ) : data?.recent.length ? (
              <div className="note-grid two">
                {data.recent.slice(0, 2).map((n: any) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            ) : (
              <Empty
                title="Every community starts somewhere."
                text={
                  admin
                    ? "Upload a PDF for your students."
                    : "Approved PDFs will appear here. Share your own notes for admin review."
                }
                action={admin ? "Upload a PDF" : "Explore notes"}
                href={admin ? "/upload" : "/explore"}
              />
            )}
          </Section>
        </div>
        <aside className="dashboard-right">
          <section className="panel continue-panel">
            <div className="section-heading">
              <h2>Continue learning</h2>
              <BookOpen size={19} className="muted" />
            </div>
            {data?.history.length ? (
              data.history.slice(0, 2).map((n: any) => (
                <Link
                  className="compact-note"
                  key={n.id}
                  href={"/notes/" + n.id}
                >
                  <span className="compact-icon lavender">
                    <FileText size={21} />
                  </span>
                  <span>
                    <strong>{n.title}</strong>
                    <small>
                      {n.subject} · Sem {n.semester}
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </Link>
              ))
            ) : (
              <div className="mini-empty">
                <BookOpen size={26} />
                <p>Your next chapter is waiting.</p>
                <small>Open a note to pick it up here later.</small>
                <Link className="text-link" href="/explore">
                  Find something to read
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>
          <section className="panel quick-panel">
            <div className="section-heading">
              <h2>Your study shortcuts</h2>
            </div>
            {[
              {
                label: "Explore all subjects",
                desc: "Find a fresh perspective",
                href: "/explore",
                icon: Search,
                color: "lavender",
              },
              {
                label: "Your saved notes",
                desc: "Everything you want to revisit",
                href: "/bookmarks",
                icon: Bookmark,
                color: "peach",
              },
              {
                label: "Build a collection",
                desc: "A little order for your ideas",
                href: "/library",
                icon: FolderPlus,
                color: "mint",
              },
            ].map((a) => (
              <Link className="compact-note" href={a.href} key={a.href}>
                <span className={"compact-icon " + a.color}>
                  <a.icon size={19} />
                </span>
                <span>
                  <strong>{a.label}</strong>
                  <small>{a.desc}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </section>
          <section className="panel activity-panel">
            <div className="section-heading">
              <h2>Around your sphere</h2>
              <span className="live-dot" />
            </div>
            {data?.activity.length ? (
              data.activity.map((a: any) => (
                <Link
                  className="activity-item"
                  href={"/notes/" + a.note_id}
                  key={a.id}
                >
                  <span className="activity-dot" />
                  <div>
                    <p>{a.message}</p>
                    <small>{date(a.created_at)}</small>
                  </div>
                </Link>
              ))
            ) : (
              <div className="mini-empty">
                <p>You’re all caught up.</p>
                <small>Reviews and upload updates will appear here.</small>
              </div>
            )}
          </section>
          <div className="study-tip">
            <span>✦ A LITTLE REMINDER</span>
            <p>
              “The beautiful thing about learning is that no one can take it
              away from you.”
            </p>
            <small>— B. B. King</small>
          </div>
        </aside>
      </div>
      {data?.popular.some((n: any) => n.views > 0) && (
        <Section
          title="Getting a little attention"
          sub="The notes your community is reading."
          href="/explore?sort=views"
        >
          <div className="note-grid">
            {data.popular.slice(0, 3).map((n: any) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </Section>
      )}
      {data?.topRated.length > 0 && (
        <Section
          title="Loved by learners"
          sub="Top rated by students in your community."
          href="/explore?sort=rating"
        >
          <div className="note-grid">
            {data.topRated.slice(0, 3).map((n: any) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </Section>
      )}
      {data?.bookmarked.length > 0 && (
        <Section
          title="Worth another look"
          sub="Recently saved to your personal library."
          href="/bookmarks"
        >
          <div className="note-grid">
            {data.bookmarked.slice(0, 3).map((n: any) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
export function Explore({
  mode = "explore",
  collection = "",
  reloadKey = 0,
}: {
  mode?: string;
  collection?: string;
  reloadKey?: number;
}) {
  const { user } = useApp();
  const catalog = useRemote("catalog"),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [page, setPage] = useState(1),
    [showFilters, setShowFilters] = useState(false),
    [list, setList] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const next: Record<string, string> = {};
    for (const [k, v] of p) {
      if (k !== "q" && k !== "page") next[k] = v;
    }
    setFilters(next);
    setSearch(p.get("q") || "");
    setDebounced(p.get("q") || "");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const params = new URLSearchParams({
    ...filters,
    q: debounced,
    page: String(page),
    ...(mode !== "explore" ? { mode } : {}),
    ...(collection ? { collection } : {}),
  });
  const remote = useRemote(
      "notes?" + params.toString() + "&refresh=" + reloadKey,
    ),
    { data, loading, error, reload } = remote;
  const set = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const active = Object.entries(filters).filter(([k, v]) => v && k !== "sort");
  const subjects = catalog.data?.subjects || [],
    courses = catalog.data?.courses || [];
  const filterControls = (
    <>
      <label>
        Course
        <select
          value={filters.course || ""}
          onChange={(e) => set("course", e.target.value)}
        >
          <option value="">All courses</option>
          {courses.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Subject
        <select
          value={filters.subject || ""}
          onChange={(e) => set("subject", e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Semester
        <select
          value={filters.semester || ""}
          onChange={(e) => set("semester", e.target.value)}
        >
          <option value="">Any semester</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>
      </label>
      <label>
        File format
        <select
          value={filters.type || ""}
          onChange={(e) => set("type", e.target.value)}
        >
          <option value="">All formats</option>
          <option value="application/pdf">PDF</option>
          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
            DOCX
          </option>
          <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
            PPTX
          </option>
        </select>
      </label>
      <label>
        Minimum rating
        <select
          value={filters.rating || ""}
          onChange={(e) => set("rating", e.target.value)}
        >
          <option value="">Any rating</option>
          {[4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}+ stars
            </option>
          ))}
        </select>
      </label>
      <label>
        Uploaded
        <select
          value={filters.days || ""}
          onChange={(e) => set("days", e.target.value)}
        >
          <option value="">Any time</option>
          <option value="7">This week</option>
          <option value="30">This month</option>
          <option value="365">This year</option>
        </select>
      </label>
      <label>
        College
        <input
          placeholder="Exact college name"
          value={filters.college || ""}
          onChange={(e) => set("college", e.target.value)}
        />
      </label>
      <label>
        Department / branch
        <input
          placeholder="e.g. Computer Science"
          value={filters.branch || ""}
          onChange={(e) => set("branch", e.target.value)}
        />
      </label>
      <label>
        Academic year
        <input
          placeholder="2026-2027"
          value={filters.year || ""}
          onChange={(e) => set("year", e.target.value)}
        />
      </label>
      <label>
        Approval status
        <select
          value={filters.status || ""}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">Any accessible note</option>
          <option value="approved">Approved</option>
          {mode === "uploads" && (
            <>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </>
          )}
        </select>
      </label>
    </>
  );
  return (
    <>
      {mode === "explore" && (
        <div className="page-heading">
          <div>
            <span className="eyebrow">KNOWLEDGE, WITHOUT THE HUNT</span>
            <h1>
              Find your next <span className="serif-accent">breakthrough.</span>
            </h1>
            <p>
              Fresh ideas, clear explanations, and a whole campus of knowledge.
            </p>
          </div>
          <span className="heading-doodle">✳</span>
        </div>
      )}
      <div className="discovery-search">
        <Search size={22} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes, subjects, topics or contributors…"
          aria-label="Search notes"
        />
        {search && (
          <button
            className="icon-btn"
            aria-label="Clear search"
            onClick={() => setSearch("")}
          >
            <X size={17} />
          </button>
        )}
        <span className="search-hint">
          A little curiosity goes a long way ↗
        </span>
      </div>
      <div className="filter-bar">
        <button
          className={"btn " + (showFilters ? "selected" : "")}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          Filters
          {active.length > 0 && (
            <span className="count-pill">{active.length}</span>
          )}
        </button>
        <select
          className="filter-select"
          aria-label="Quick subject filter"
          value={filters.subject || ""}
          onChange={(e) => set("subject", e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Quick semester filter"
          value={filters.semester || ""}
          onChange={(e) => set("semester", e.target.value)}
        >
          <option value="">All semesters</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>
        <span className="filter-spacer" />
        <label className="sort-label">
          Sort by
          <select
            aria-label="Sort notes"
            value={filters.sort || "relevant"}
            onChange={(e) => set("sort", e.target.value)}
          >
            {[
              ["relevant", "Most relevant"],
              ["recent", "Recently uploaded"],
              ["rating", "Highest rated"],
              ["views", "Most viewed"],
              ["downloads", "Most downloaded"],
              ["bookmarks", "Most bookmarked"],
              ["title", "Title A–Z"],
              ...(mode === "bookmarks" ? [["saved", "Recently saved"]] : []),
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {showFilters && (
        <div className="filters-panel panel">{filterControls}</div>
      )}
      {active.length > 0 && (
        <div className="active-filters">
          {active.map(([k, v]) => (
            <button key={k} onClick={() => set(k, "")}>
              {k}:{" "}
              {subjects.find((s: any) => s.id === v)?.name ||
                courses.find((s: any) => s.id === v)?.name ||
                (k === "type"
                  ? v === "application/pdf"
                    ? "PDF"
                    : v.includes("presentation")
                      ? "PPTX"
                      : "DOCX"
                  : v)}
              <X size={12} />
            </button>
          ))}
          <button
            className="clear-all"
            onClick={() => {
              setFilters({});
              setPage(1);
            }}
          >
            Clear all
          </button>
        </div>
      )}
      <div className="results-heading">
        <span>
          {loading ? (
            "Finding your next read…"
          ) : (
            <>
              <strong>{data?.total || 0}</strong>{" "}
              {mode === "uploads"
                ? "uploaded notes"
                : mode === "bookmarks"
                  ? "saved notes"
                  : "notes to explore"}
              {debounced && (
                <>
                  {" "}
                  for <strong>“{debounced}”</strong>
                </>
              )}
            </>
          )}
        </span>
        <div className="view-toggle">
          <button
            className={list ? "" : "active"}
            aria-label="Grid view"
            onClick={() => setList(false)}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            className={list ? "active" : ""}
            aria-label="List view"
            onClick={() => setList(true)}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading ? (
        <Skeleton count={6} />
      ) : data?.notes.length ? (
        <div className={"note-grid " + (list ? "list-view" : "")}>
          {data.notes.map((n: any) => (
            <NoteCard
              note={n}
              key={n.id}
              refresh={mode === "bookmarks" ? reload : undefined}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={
            mode === "uploads"
              ? "Your knowledge has a place here."
              : mode === "bookmarks"
                ? "Keep the good ideas close."
                : "No notes here. Yet."
          }
          text={
            debounced || active.length
              ? "Try a broader search, a different subject, or fewer filters."
              : mode === "uploads"
                ? "Share your first document with your campus."
                : mode === "bookmarks"
                  ? "Tap the bookmark on a note to save it for later."
                  : "Approved PDFs will appear here. Share your notes for admin review."
          }
          action="Upload a PDF"
          href="/upload"
        />
      )}
      <div className="pagination">
        <span>
          Page {page}
          {data?.total > 0 && ` of ${Math.ceil(data.total / 12)}`}
        </span>
        <button
          className="btn"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft size={15} />
          Previous
        </button>
        <button
          className="btn"
          disabled={loading || page * 12 >= (data?.total || 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </>
  );
}
export function LibraryPage({ mode }: { mode: string }) {
  const { toast } = useApp(),
    remote = useRemote("collections"),
    [selected, setSelected] = useState(""),
    [name, setName] = useState(""),
    [create, setCreate] = useState(false),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false);
  const [rename, setRename] = useState("");
  async function collection(action: string, id?: string) {
    setBusy(true);
    try {
      await api(
        id ? "collections/" + id : "collections",
        id ? { action, name: rename } : { name },
      );
      setCreate(false);
      setName("");
      setRename("");
      if (action === "delete") setSelected("");
      remote.reload();
      setVersion((v) => v + 1);
      toast(
        action === "delete"
          ? "Collection deleted"
          : action === "rename"
            ? "Collection renamed"
            : "Collection created",
      );
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  const chosen = remote.data?.collections.find((c: any) => c.id === selected);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {mode === "uploads"
              ? "KNOWLEDGE YOU’VE SHARED"
              : "YOUR IDEAS, BEAUTIFULLY ORGANIZED"}
          </span>
          <h1>
            {mode === "uploads"
              ? "A little knowledge, passed on."
              : mode === "bookmarks"
                ? "Keep the good ideas close."
                : "Your personal learning library."}
          </h1>
          <p>
            {mode === "uploads"
              ? "Manage your uploads, drafts and community contributions."
              : "A home for the notes you want to come back to."}
          </p>
        </div>
        {mode === "uploads" ? (
          <Link className="btn primary" href="/upload">
            <Plus size={16} />
            Upload notes
          </Link>
        ) : (
          <button className="btn primary" onClick={() => setCreate(!create)}>
            <FolderPlus size={17} />
            New collection
          </button>
        )}
      </div>
      {create && (
        <form
          className="inline collection-form panel"
          onSubmit={(e) => {
            e.preventDefault();
            collection("create");
          }}
        >
          <Folder size={21} />
          <input
            aria-label="Collection name"
            placeholder="Give your collection a name…"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn primary" disabled={busy}>
            Create collection
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cancel"
            onClick={() => setCreate(false)}
          >
            <X size={18} />
          </button>
        </form>
      )}
      {mode !== "uploads" && (
        <div className="collections-grid">
          <button
            className={"collection-card " + (!selected ? "active" : "")}
            onClick={() => setSelected("")}
          >
            <span className="compact-icon lavender">
              <Bookmark size={22} />
            </span>
            <strong>All saved notes</strong>
            <small>
              Your whole collection of ideas
              <ArrowRight size={14} />
            </small>
          </button>
          {remote.data?.collections.map((c: any, i: number) => (
            <button
              className={
                "collection-card " + (selected === c.id ? "active" : "")
              }
              key={c.id}
              onClick={() => setSelected(c.id)}
            >
              <span
                className={"compact-icon " + ["mint", "peach", "blue"][i % 3]}
              >
                <Folder size={22} />
              </span>
              <strong>{c.name}</strong>
              <small>
                {c.note_count} notes
                <ArrowRight size={14} />
              </small>
            </button>
          ))}
        </div>
      )}
      {remote.error && (
        <ErrorState error={remote.error} retry={remote.reload} />
      )}
      {chosen && (
        <div className="panel collection-manage">
          <strong>{chosen.name}</strong>
          <input
            aria-label="Rename collection"
            placeholder="New collection name"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            maxLength={60}
          />
          <button
            className="btn"
            disabled={!rename || busy}
            onClick={() => collection("rename", chosen.id)}
          >
            Rename
          </button>
          <button
            className="btn danger"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Delete this collection? The notes themselves will remain.",
                )
              )
                collection("delete", chosen.id);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
      <Explore
        key={selected}
        mode={
          mode === "uploads" ? "uploads" : selected ? "explore" : "bookmarks"
        }
        collection={selected}
        reloadKey={version}
      />
      {mode === "library" && (
        <Section
          title="Recently opened"
          sub="A little reminder of where you left off."
        >
          <RecentHistory />
        </Section>
      )}
    </>
  );
}
function RecentHistory() {
  const { data, loading } = useRemote("notes?mode=history&sort=history");
  return loading ? (
    <Skeleton />
  ) : data?.notes.length ? (
    <div className="note-grid">
      {data.notes.slice(0, 3).map((n: any) => (
        <NoteCard key={n.id} note={n} />
      ))}
    </div>
  ) : (
    <Empty
      title="Your reading journey starts here."
      text="Notes you open will appear here, ready for another look."
    />
  );
}
export function Upload() {
  const config = useRemote("config");
  const maxFileMb = config.data?.maxFileMb || 4;
  const { user, toast } = useApp(),
    router = useRouter(),
    catalog = useRemote("catalog");
  const [file, setFile] = useState<File | null>(null),
    [drag, setDrag] = useState(false),
    [course, setCourse] = useState(user?.course || "btech-cs"),
    [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState("");
  const xhr = useRef<XMLHttpRequest | null>(null),
    picker = useRef<HTMLInputElement>(null),
    draft = useRef(false);
  const courses = catalog.data?.courses || [],
    subjects = (catalog.data?.subjects || []).filter(
      (s: any) => s.course_id === course,
    );
  function choose(f?: File) {
    setError("");
    if (!f) return;
    if (f.size > maxFileMb * 1024 * 1024) {
      setError(`Please choose a document smaller than ${maxFileMb} MB.`);
      return;
    }
    if (!/\.pdf$/i.test(f.name)) {
      setError("Choose a PDF document.");
      return;
    }
    setFile(f);
  }
  useEffect(() => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => xhr.current?.abort(), []);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Add a document to continue.");
      return;
    }
    const data = new FormData(e.currentTarget);
    data.set("file", file);
    data.set("status", draft.current ? "draft" : "pending");
    setBusy(true);
    setProgress(0);
    const request = new XMLHttpRequest();
    xhr.current = request;
    request.open("POST", "/api/upload");
    request.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };
    request.onload = () => {
      setBusy(false);
      let result: any;
      try {
        result = JSON.parse(request.responseText);
      } catch {
        setError("The server could not process the upload. Please retry.");
        return;
      }
      if (request.status >= 400) {
        setError(result.error);
        return;
      }
      toast(result.message);
      router.push("/notes/" + result.id);
    };
    request.onerror = () => {
      setBusy(false);
      setError("Connection interrupted. Your file is selected; try again.");
    };
    request.onabort = () => {
      setBusy(false);
      setError("Upload canceled. You can retry when ready.");
    };
    request.send(data);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SHARE A LITTLE. HELP A LOT.</span>
          <h1>Pass the knowledge on.</h1>
          <p>
            {user?.role === "admin"
              ? "Publish a PDF and notify all registered students."
              : "Upload a PDF for admin approval before sharing it with students."}
          </p>
        </div>
        <Link href="/uploads" className="text-link">
          My uploads
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="upload-layout">
        <form className="panel upload-form" onSubmit={submit}>
          <div className="form-section-heading">
            <span className="step-number">01</span>
            <div>
              <h2>The good stuff</h2>
              <p>Start with your document. We’ll take care of the rest.</p>
            </div>
          </div>
          <div
            className={"dropzone " + (drag ? "dragging" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!busy) choose(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={picker}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(e) => choose(e.target.files?.[0])}
              disabled={busy}
            />
            {file ? (
              <>
                <span className="upload-file-icon">
                  <FileText size={28} />
                </span>
                <strong>{file.name}</strong>
                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to share
                </span>
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => picker.current?.click()}
                >
                  Choose a different file
                </button>
              </>
            ) : (
              <>
                <span className="upload-file-icon">
                  <UploadCloud size={30} />
                </span>
                <strong>Drop a little knowledge here</strong>
                <p>
                  Drag your document here, or{" "}
                  <button type="button" onClick={() => picker.current?.click()}>
                    browse files
                  </button>
                </p>
                <small>
                  PDF only · Up to {maxFileMb} MB · For registered students
                </small>
              </>
            )}
          </div>
          {preview && (
            <details className="file-preview">
              <summary>Preview selected PDF</summary>
              <iframe src={preview} title="Selected document preview" />
            </details>
          )}
          <div className="form-section-heading">
            <span className="step-number">02</span>
            <div>
              <h2>Give it a little context</h2>
              <p>Help the right students find your notes.</p>
            </div>
          </div>
          <label>
            Note title <span className="required">*</span>
            <input
              name="title"
              required
              minLength={5}
              maxLength={160}
              placeholder="e.g. Data Structures — Trees & Graphs, Simplified"
            />
          </label>
          <label>
            Description <span className="required">*</span>
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={4}
              placeholder="What’s inside? Mention key concepts, chapters, or what makes these notes helpful."
            />
          </label>
          <div className="form-grid">
            <label>
              Course <span className="required">*</span>
              <select
                name="course_id"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
              >
                {courses.map((c: any) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subject <span className="required">*</span>
              <select key={course} name="subject_id" required>
                <option value="">Select a subject</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Branch / department
              <input
                name="branch"
                defaultValue={user?.branch || ""}
                maxLength={100}
                placeholder="Computer Science"
              />
            </label>
            <label>
              Semester
              <select name="semester" defaultValue={user?.semester || 1}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              College
              <input
                name="college"
                defaultValue={user?.college || ""}
                placeholder="Your college name"
                maxLength={150}
              />
            </label>
            <label>
              Academic year
              <input
                name="academic_year"
                required
                pattern="\d{4}-\d{4}"
                defaultValue="2026-2027"
                placeholder="2026-2027"
              />
            </label>
            <label>
              Topic
              <input
                name="topic"
                maxLength={150}
                placeholder="e.g. Binary trees and graph traversal"
              />
            </label>
            <label>
              Language
              <input
                name="language"
                required
                defaultValue="English"
                maxLength={50}
              />
            </label>
          </div>
          <label>
            Tags
            <input
              name="tags"
              maxLength={250}
              placeholder="e.g. revision, unit-2, algorithms (comma separated)"
            />
            <small>Up to 10 tags to make your notes easier to discover.</small>
          </label>
          <label>
            Who can see this?
            <select name="visibility" defaultValue="public">
              <option value="public">
                {user?.role === "admin"
                  ? "All registered students — available immediately"
                  : "All registered students — after admin approval"}
              </option>
              <option value="private">
                Only me and admins — keep it in my private library
              </option>
            </select>
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {busy && (
            <div className="upload-progress">
              <div className="between">
                <span>
                  {progress === 100
                    ? "Validating and saving your document…"
                    : "Sharing your knowledge…"}
                </span>
                <strong>{progress}%</strong>
              </div>
              <progress value={progress} max={100} />
              <button
                type="button"
                className="text-link"
                onClick={() => xhr.current?.abort()}
              >
                Cancel upload
              </button>
            </div>
          )}
          <div className="form-actions">
            <button
              className="btn"
              type="submit"
              disabled={busy}
              onClick={() => (draft.current = true)}
            >
              <Save size={16} />
              Save as draft
            </button>
            <button
              className="btn primary"
              type="submit"
              disabled={busy}
              onClick={() => (draft.current = false)}
            >
              {busy ? (
                <Busy text="Uploading…" />
              ) : (
                <>
                  <UploadCloud size={17} />
                  {user?.role === "admin"
                    ? "Publish PDF"
                    : "Submit for approval"}
                </>
              )}
            </button>
          </div>
        </form>
        <aside className="upload-tips">
          <div className="panel">
            <span className="tip-symbol">✦</span>
            <h2>A great note goes a long way.</h2>
            <p>A few thoughtful touches make all the difference.</p>
            <ul>
              <li>
                <CheckCircle2 size={17} />
                <span>
                  <strong>Clear is kind.</strong>
                  <br />
                  Use a descriptive title and legible pages.
                </span>
              </li>
              <li>
                <CheckCircle2 size={17} />
                <span>
                  <strong>Make it yours.</strong>
                  <br />
                  Share original notes or material you have permission to
                  distribute.
                </span>
              </li>
              <li>
                <CheckCircle2 size={17} />
                <span>
                  <strong>Context helps.</strong>
                  <br />
                  Add subjects and tags so your classmates can find it.
                </span>
              </li>
            </ul>
            <div className="info-box">
              <ShieldCheck size={19} />
              <span>
                {user?.role === "admin"
                  ? "Only signed-in students and admins can access published PDFs."
                  : "Your PDF stays visible only to you and admins until approved. Private notes remain private after approval."}
              </span>
            </div>
          </div>
          <div className="study-tip">
            <span>KNOWLEDGE GROWS WHEN SHARED</span>
            <p>
              Small contribution.
              <br />
              Big possibility.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function NoteDetail({ id }: { id: string }) {
  const { user, toast } = useApp(),
    router = useRouter();
  const [sort, setSort] = useState("newest"),
    remote = useRemote(`notes/${id}?sort=${sort}`),
    collections = useRemote(user ? "collections" : "me");
  const [rating, setRating] = useState(0),
    [review, setReview] = useState(""),
    [busy, setBusy] = useState(false),
    [collection, setCollection] = useState(""),
    [reason, setReason] = useState(""),
    [report, setReport] = useState<string | null>(null),
    [deleteConfirm, setDeleteConfirm] = useState(false);
  const n = remote.data?.note,
    own = n?.user_id === user?.id,
    mine = remote.data?.reviews.find((r: any) => r.user_id === user?.id);
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setReview(mine.content);
    }
  }, [mine?.id, mine?.updated_at]);
  useEffect(() => {
    if (n && user) api(`notes/${id}/view`, {}).catch(() => {});
  }, [id, !!n, user?.id]);
  async function action(url: string, body: any, message: string) {
    setBusy(true);
    try {
      await api(url, body);
      toast(message);
      remote.reload();
      return true;
    } catch (e: any) {
      toast(e.message, true);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (remote.loading && !n) return <Skeleton />;
  if (remote.error)
    return <ErrorState error={remote.error} retry={remote.reload} />;
  if (!n) return null;
  return (
    <>
      <Link className="text-link back-link" href="/explore">
        <ChevronLeft size={16} />
        Back to explore
      </Link>
      <div className="note-detail-heading">
        <div>
          <div className="inline">
            <span className="subject-tag lavender">{n.subject}</span>
            <span className="muted">Semester {n.semester}</span>
            <span className="status">{n.status}</span>
            {n.visibility === "private" && (
              <span className="status">Private</span>
            )}
          </div>
          <h1>{n.title}</h1>
          <div className="inline detail-meta">
            <Avatar user={{ name: n.uploader, avatar: n.avatar }} size={28} />
            <strong>{n.uploader}</strong>
            <span>·</span>
            <span>{date(n.created_at)}</span>
            <span>·</span>
            <Rating value={n.rating} count={n.review_count} />
          </div>
        </div>
        <div className="inline">
          <button
            className={"btn " + (n.bookmarked ? "selected" : "")}
            disabled={busy}
            onClick={() =>
              user
                ? action(
                    `notes/${id}/bookmark`,
                    { saved: !n.bookmarked },
                    n.bookmarked ? "Bookmark removed" : "Saved to your library",
                  )
                : router.push("/login")
            }
          >
            <Bookmark size={16} fill={n.bookmarked ? "currentColor" : "none"} />
            {n.bookmarked ? "Saved" : "Save note"}
          </button>
          <a
            className="btn primary"
            href={user ? `/api/notes/${id}/file?download=1` : "/login"}
          >
            <Download size={16} />
            Download
          </a>
        </div>
      </div>
      {own && n.status === "draft" && (
        <div className="info-box">
          <FileText size={19} />
          <span>
            This is a private draft. Ready to share it with your campus?
          </span>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              action(
                `notes/${id}/publish`,
                {},
                user?.role === "admin"
                  ? "PDF published to your students"
                  : "PDF submitted for admin approval",
              )
            }
          >
            {user?.role === "admin"
              ? "Publish to students"
              : "Submit for approval"}
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      {own && n.status === "pending" && (
        <div className="info-box">
          <Clock size={18} />
          Your note is waiting for an administrator to review it. You can
          preview it while you wait.
        </div>
      )}
      <div className="note-detail-layout">
        <div>
          {!user ? (
            <div className="panel">
              <Empty
                title="Your next chapter is waiting."
                text="Sign in to preview, download, review and organize this note."
                action="Sign in to read"
                href="/login"
              />
            </div>
          ) : n.mime === "application/pdf" ? (
            <PdfViewer id={id} />
          ) : (
            <div className="panel document-fallback">
              <FileText size={50} />
              <h2>A little knowledge to take with you.</h2>
              <p>
                This {n.mime.includes("presentation") ? "PPTX" : "DOCX"}{" "}
                document opens best in your document app.
              </p>
              <a
                className="btn primary"
                href={`/api/notes/${id}/file?download=1`}
              >
                <Download size={17} />
                Download document
              </a>
            </div>
          )}
          <section className="panel description-panel">
            <h2>About these notes</h2>
            <p>{n.description}</p>
            <div className="inline tags">
              {n.tags
                ?.split(",")
                .filter(Boolean)
                .map((t: string) => (
                  <Link href={"/explore?q=" + encodeURIComponent(t)} key={t}>
                    #{t}
                  </Link>
                ))}
            </div>
          </section>
          <section className="panel reviews-panel">
            <div className="section-heading">
              <div>
                <h2>A little feedback goes a long way.</h2>
                <p>
                  {n.review_count} reviews · <Rating value={n.rating} />
                </p>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort reviews"
              >
                <option value="newest">Newest first</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </div>
            {user && !own && (
              <form
                className="review-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await action(
                      `notes/${id}/review`,
                      { rating, content: review },
                      "Your review has been saved",
                    )
                  ) {
                  }
                }}
              >
                <strong>
                  {mine
                    ? "Update your perspective"
                    : "How did these notes help?"}
                </strong>
                <div
                  className="star-picker"
                  role="group"
                  aria-label="Choose rating"
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      type="button"
                      key={v}
                      aria-label={`${v} star${v > 1 ? "s" : ""}`}
                      aria-pressed={rating === v}
                      onClick={() => setRating(v)}
                    >
                      <Star
                        size={25}
                        fill={v <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                  <span>
                    {rating
                      ? [
                          "",
                          "A starting point",
                          "Could be better",
                          "Helpful",
                          "Really helpful",
                          "A breakthrough!",
                        ][rating]
                      : "Choose a rating"}
                  </span>
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  placeholder="Share what worked well and what could be even better…"
                />
                <div className="between">
                  <small>
                    One thoughtful review per student. Edit it any time.
                  </small>
                  <button className="btn primary" disabled={busy || !rating}>
                    {busy ? (
                      <Busy />
                    ) : mine ? (
                      "Update review"
                    ) : (
                      "Share your review"
                    )}
                  </button>
                </div>
              </form>
            )}
            {!user && (
              <p className="muted">
                <Link href="/login" className="text-link">
                  Sign in
                </Link>{" "}
                to share your perspective.
              </p>
            )}
            {remote.data?.reviews.length ? (
              remote.data.reviews.map((r: any) => (
                <article className="review-item" key={r.id}>
                  <div className="between">
                    <div className="inline">
                      <Avatar user={r} />
                      <div>
                        <strong>{r.name}</strong>
                        <small>{date(r.updated_at)}</small>
                      </div>
                    </div>
                    <Rating value={r.rating} />
                  </div>
                  <p>{r.content}</p>
                  <div className="inline">
                    {r.user_id === user?.id && (
                      <button
                        className="text-link danger"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            await action(
                              `notes/${id}/review`,
                              { action: "delete" },
                              "Review deleted",
                            )
                          ) {
                            setReview("");
                            setRating(0);
                          }
                        }}
                      >
                        <Trash2 size={13} />
                        Delete my review
                      </button>
                    )}
                    {user && r.user_id !== user.id && (
                      <button
                        className="text-link muted"
                        onClick={() => setReport(r.id)}
                      >
                        <Flag size={12} />
                        Report review
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="mini-empty">
                <MessageSquare size={25} />
                <p>No reviews yet.</p>
                <small>
                  {own
                    ? "Your classmates’ feedback will appear here."
                    : "A thoughtful first review can make all the difference."}
                </small>
              </div>
            )}
          </section>
        </div>
        <aside className="note-sidebar">
          <div className="panel">
            <h2>The details</h2>
            <dl>
              {[
                ["Course", n.course],
                ["Subject", n.subject],
                ["Semester", n.semester],
                ["Academic year", n.academic_year],
                ["College", n.college || "Not specified"],
                ["Language", n.language],
                ["File size", `${(n.size / 1024 / 1024).toFixed(2)} MB`],
                ["Views", n.views],
                ["Downloads", n.downloads],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {user && (
            <div className="panel">
              <h2>Make a little room.</h2>
              <p className="muted">Add this note to a private collection.</p>
              <select
                aria-label="Choose collection"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              >
                <option value="">Choose a collection</option>
                {collections.data?.collections.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="btn full"
                disabled={!collection || busy}
                onClick={() =>
                  action(
                    "collections/" + collection,
                    { note_id: id },
                    "Added to collection",
                  )
                }
              >
                <FolderPlus size={16} />
                Add to collection
              </button>
              <button
                className="text-link"
                disabled={!collection || busy}
                onClick={() =>
                  action(
                    "collections/" + collection,
                    { action: "remove", note_id: id },
                    "Removed from collection",
                  )
                }
              >
                Remove from selected collection
              </button>
              <Link className="text-link" href="/library">
                Manage collections
                <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          {user && (
            <button
              className="text-link muted"
              onClick={() => setReport("note")}
            >
              <Flag size={14} />
              Report this note
            </button>
          )}
          {own && (
            <button
              className="text-link danger"
              onClick={() => setDeleteConfirm(!deleteConfirm)}
            >
              <Trash2 size={14} />
              Delete my note
            </button>
          )}
          {deleteConfirm && (
            <div className="panel">
              <p>Permanently delete this note, its file and related reviews?</p>
              <button
                className="btn danger"
                disabled={busy}
                onClick={async () => {
                  if (await action(`notes/${id}/delete`, {}, "Note deleted"))
                    router.push("/uploads");
                }}
              >
                Confirm deletion
              </button>
            </div>
          )}
        </aside>
      </div>
      {report && (
        <div className="modal-backdrop">
          <form
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-heading"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await action(
                  `notes/${id}/report`,
                  {
                    reason,
                    ...(report !== "note" ? { review_id: report } : {}),
                  },
                  "Report sent to the moderators",
                )
              ) {
                setReport(null);
                setReason("");
              }
            }}
          >
            <div className="between">
              <h2 id="report-heading">Help keep this sphere thoughtful.</h2>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close report"
                onClick={() => setReport(null)}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              What should the moderator know?
              <textarea
                autoFocus
                required
                minLength={10}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </label>
            <button className="btn primary" disabled={busy}>
              Submit report
            </button>
          </form>
        </div>
      )}
      {remote.data?.related.length > 0 && (
        <Section
          title="Keep the curiosity going"
          sub="More notes from the same subject."
        >
          <div className="note-grid">
            {remote.data.related.map((r: any) => (
              <NoteCard key={r.id} note={r} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
export function Profile({ settings = false }: { settings?: boolean }) {
  const { user, setUser, toast } = useApp(),
    catalog = useRemote("catalog");
  const [busy, setBusy] = useState(false),
    [avatar, setAvatar] = useState(user?.avatar || ""),
    [error, setError] = useState(""),
    [course, setCourse] = useState(user?.course || "");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("profile", {
        ...Object.fromEntries(new FormData(e.currentTarget)),
        avatar,
      });
      const r = await api("me");
      setUser(r.user);
      toast("Your profile is looking good. Changes saved.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function image(f?: File) {
    if (!f) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
      f.size > 200000
    ) {
      setError("Use a PNG, JPEG or WebP image smaller than 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(f);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A SPACE THAT FEELS LIKE YOU</span>
          <h1>
            {settings ? "A few personal preferences." : "Hello, curious mind."}
          </h1>
          <p>
            Tell us a little about yourself. We’ll help you find your people and
            your notes.
          </p>
        </div>
      </div>
      <div className="profile-layout">
        <form className="panel profile-form" onSubmit={save}>
          <div className="profile-avatar-row">
            <Avatar user={{ ...user, avatar }} size={76} />
            <div>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
              <label className="text-link avatar-upload">
                <Camera size={14} />
                Change photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => image(e.target.files?.[0])}
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  className="text-link muted"
                  onClick={() => setAvatar("")}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <h2>The basics</h2>
          <div className="form-grid">
            <label>
              Full name
              <input
                name="name"
                defaultValue={user?.name}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              College
              <input
                name="college"
                defaultValue={user?.college}
                maxLength={150}
                placeholder="Your college name"
              />
            </label>
          </div>
          <h2>Your academic sphere</h2>
          <div className="form-grid">
            <label>
              Course
              <select
                name="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="">Select your course</option>
                {catalog.data?.courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Department / branch
              <select name="branch" defaultValue={user?.branch || ""}>
                <option value="">Choose department</option>
                {catalog.data?.departments.map((d: any) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Semester
              <select name="semester" defaultValue={user?.semester || 1}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Academic interests
              <input
                name="interests"
                defaultValue={user?.interests}
                maxLength={500}
                placeholder="Algorithms, design, robotics…"
              />
            </label>
          </div>
          <p className="form-fineprint">
            Your name and photo appear on your public notes and reviews. Your
            collections remain private.
          </p>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <div className="form-actions">
            <button className="btn primary" disabled={busy}>
              {busy ? (
                <Busy />
              ) : (
                <>
                  <Check size={16} />
                  Save your changes
                </>
              )}
            </button>
          </div>
        </form>
        <aside>
          <div className="panel profile-tip">
            <span className="tip-symbol">✦</span>
            <h2>Good to know you.</h2>
            <p>
              Adding your course and semester makes your dashboard
              recommendations a little more relevant.
            </p>
            <div className="info-box">
              <ShieldCheck size={20} />
              <span>Your personal collections are visible only to you.</span>
            </div>
          </div>
          <div className="panel account-settings">
            <h2>Account & security</h2>
            <p>
              Your password is securely hashed. Reset it using a secure email
              link.
            </p>
            <Link className="btn full" href="/forgot-password">
              Reset password
              <ArrowUpRight size={14} />
            </Link>
            <p>
              Use the theme control in the sidebar to choose your preferred
              appearance.
            </p>
            <Link className="text-link" href="/privacy">
              Privacy policy
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Notifications() {
  const { toast } = useApp(),
    { data, loading, error, reload } = useRemote("notifications");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE LATEST IN YOUR CORNER</span>
          <h1>Around your sphere.</h1>
          <p>
            A little feedback, a little progress. All your updates in one place.
          </p>
        </div>
        <button
          className="btn"
          onClick={async () => {
            try {
              await api("notifications", {});
              reload();
              toast("All caught up. Notifications marked as read.");
            } catch (e: any) {
              toast(e.message, true);
            }
          }}
        >
          <CheckCircle2 size={16} />
          Mark all as read
        </button>
      </div>
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading ? (
        <Skeleton />
      ) : (
        <div className="panel notification-list">
          {data?.notifications.length ? (
            data.notifications.map((n: any) => (
              <Link
                className={"notification-row " + (!n.is_read ? "unread" : "")}
                key={n.id}
                href={"/notes/" + n.note_id}
              >
                <span className="compact-icon lavender">
                  <Bell size={20} />
                </span>
                <div>
                  <strong>{n.message}</strong>
                  <small>{date(n.created_at)}</small>
                </div>
                {!n.is_read && <span className="live-dot" />}
                <ArrowUpRight size={17} />
              </Link>
            ))
          ) : (
            <Empty
              title="A quiet moment. Enjoy it."
              text="Reviews on your notes and moderation updates will show up here."
            />
          )}
        </div>
      )}
    </>
  );
}
export function Admin() {
  const [invite, setInvite] = useState("");
  const { toast } = useApp(),
    remote = useRemote("admin"),
    catalog = useRemote("catalog"),
    [tab, setTab] = useState("notes"),
    [kind, setKind] = useState("subjects"),
    [busy, setBusy] = useState(false);
  async function act(b: any) {
    setBusy(true);
    try {
      await api("admin", b);
      remote.reload();
      catalog.reload();
      toast("Changes saved.");
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  const d = remote.data;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A THOUGHTFUL COMMUNITY STARTS HERE</span>
          <h1>Your admin workspace.</h1>
          <p>
            Review contributions, support your students, and keep knowledge
            flowing.
          </p>
        </div>
        <Link className="btn primary" href="/upload">
          <UploadCloud size={17} />
          Upload PDF for students
        </Link>
      </div>
      <section className="panel admin-invite">
        <div>
          <h2>Student notes. Admin control.</h2>
          <p>
            Review student submissions before they appear to classmates.
            Students receive a notification when a public PDF is approved or
            published.
          </p>
        </div>
        <div className="inline">
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await api("admin/invites", {});
                setInvite(result.code);
                toast(
                  "One-time admin invitation created. It expires in 24 hours.",
                );
              } catch (error: any) {
                toast(error.message, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            Invite an admin
          </button>
          <Link className="text-link" href="/admin/register">
            Admin registration
            <ArrowUpRight size={14} />
          </Link>
        </div>
        {invite && (
          <label className="invite-code">
            One-time invitation code (expires in 24 hours)
            <input
              readOnly
              value={invite}
              aria-label="Admin invitation code"
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
        )}
      </section>
      <div className="stats-grid">
        {[
          ["Registered students", d?.stats.users],
          ["Uploaded notes", d?.stats.notes],
          ["Awaiting approval", d?.stats.pending],
          ["Learning events", d?.stats.events],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="tabs">
        {["notes", "reports", "users", "catalog"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {remote.error && (
        <ErrorState error={remote.error} retry={remote.reload} />
      )}
      {remote.loading && !d ? (
        <Skeleton />
      ) : tab === "notes" ? (
        <div className="panel admin-list">
          {d?.notes.length ? (
            d.notes.map((n: any) => (
              <div className="admin-row" key={n.id}>
                <FileText size={22} />
                <div>
                  <Link href={"/notes/" + n.id}>
                    <strong>{n.title}</strong>
                  </Link>
                  <small>
                    {n.uploader} · {date(n.created_at)} · {n.visibility}
                  </small>
                </div>
                <span className="status">{n.status}</span>
                <Link href={"/notes/" + n.id} className="btn">
                  Review
                  <ArrowUpRight size={14} />
                </Link>
                <button
                  className="btn"
                  disabled={
                    busy || n.status === "approved" || n.status === "draft"
                  }
                  onClick={() =>
                    act({ action: "moderate", id: n.id, status: "approved" })
                  }
                >
                  <Check size={15} />
                  Approve
                </button>
                <button
                  className="btn danger"
                  disabled={
                    busy || n.status === "rejected" || n.status === "draft"
                  }
                  onClick={() =>
                    act({ action: "moderate", id: n.id, status: "rejected" })
                  }
                >
                  Reject
                </button>
                <button
                  className="icon-btn danger"
                  aria-label="Delete note"
                  disabled={busy}
                  onClick={async () => {
                    if (confirm("Permanently remove this note and file?")) {
                      try {
                        await api(`notes/${n.id}/delete`, {});
                        remote.reload();
                        toast("Content removed.");
                      } catch (e: any) {
                        toast(e.message, true);
                      }
                    }
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          ) : (
            <Empty
              title="Nothing waiting in the wings."
              text="New uploads will appear here for review."
            />
          )}
        </div>
      ) : tab === "users" ? (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {d?.users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <span className="inline">
                      <Avatar user={u} size={28} />
                      {u.name}
                      {u.is_demo && <span className="status">Demo</span>}
                    </span>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{date(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "reports" ? (
        <div className="panel admin-list">
          {d?.reports.length ? (
            d.reports.map((r: any) => (
              <article className="report-row" key={r.id}>
                <div className="between">
                  <Link href={"/notes/" + r.note_id}>
                    <strong>{r.title}</strong>
                  </Link>
                  <span className="status">
                    {r.review_id ? "Review report" : "Note report"}
                  </span>
                </div>
                <p>{r.reason}</p>
                <small>
                  Reported by {r.reporter} · {date(r.created_at)}
                </small>
                <div className="inline">
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => act({ action: "resolve", id: r.id })}
                  >
                    <Check size={15} />
                    Mark resolved
                  </button>
                  {r.review_id && (
                    <button
                      className="btn danger"
                      disabled={busy}
                      onClick={() =>
                        act({ action: "remove-review", id: r.review_id })
                      }
                    >
                      <Trash2 size={15} />
                      Remove review
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <Empty
              title="A healthy little sphere."
              text="There are no open reports to review."
            />
          )}
        </div>
      ) : (
        <div className="panel catalog-admin">
          <h2>Grow your academic catalog.</h2>
          <p className="muted">
            The initial catalog is sample taxonomy. Add your college’s actual
            departments, courses and subjects.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              act({
                action: "catalog",
                ...Object.fromEntries(new FormData(f)),
              }).then(() => f.reset());
            }}
          >
            <div className="form-grid">
              <label>
                Category
                <select
                  name="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="subjects">Subject</option>
                  <option value="courses">Course</option>
                  <option value="departments">Department</option>
                </select>
              </label>
              <label>
                Name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Academic catalog name"
                />
              </label>
              {kind !== "departments" && (
                <label>
                  Belongs to
                  <select key={kind} name="parent" required>
                    {(kind === "subjects"
                      ? catalog.data?.courses
                      : catalog.data?.departments
                    )?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <button className="btn primary" disabled={busy}>
              <Plus size={16} />
              Add to catalog
            </button>
          </form>
          <div className="catalog-tags">
            {catalog.data?.[kind]?.map((i: any) => (
              <span className="subject-tag lavender" key={i.id}>
                {i.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
