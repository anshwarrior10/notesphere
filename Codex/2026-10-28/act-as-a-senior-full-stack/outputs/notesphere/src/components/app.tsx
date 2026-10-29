"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Compass,
  Library,
  UploadCloud,
  Bookmark,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Search,
  Plus,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
  CheckCircle2,
  X,
  ShieldCheck,
  Menu,
  GraduationCap,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  Context,
  useApp,
  Avatar,
  api,
  useRemote,
  NoteCard,
  Section,
  Empty,
  Skeleton,
} from "./ui";
import {
  Dashboard,
  Explore,
  LibraryPage,
  Profile,
  Notifications,
  Admin,
  Upload,
  NoteDetail,
} from "./pages";
import { Auth } from "./auth";
const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Explore notes", href: "/explore", icon: Compass },
  { label: "My library", href: "/library", icon: Library },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "My uploads", href: "/uploads", icon: UploadCloud },
];
export function App({
  initialUser,
  missing = false,
}: {
  initialUser: any;
  missing?: boolean;
}) {
  const [user, setUser] = useState(initialUser),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [dark, setDark] = useState(false),
    [notice, setNotice] = useState<{ message: string; error: boolean } | null>(
      null,
    );
  const pathname = usePathname(),
    router = useRouter();
  const isAdmin = user?.role === "admin";
  const navItems = navigation.map((item) =>
    item.href === "/dashboard"
      ? {
          ...item,
          href: isAdmin ? "/admin" : "/student",
          label: isAdmin ? "Admin dashboard" : "Student dashboard",
        }
      : item,
  );
  const toast = (message: string, error = false) =>
    setNotice({ message, error });
  useEffect(() => {
    const saved = localStorage.getItem("ns-theme");
    setDark(saved === "dark");
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => setMobile(false), [pathname]);
  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark", !dark);
    localStorage.setItem("ns-theme", dark ? "light" : "dark");
  };
  const logout = async () => {
    try {
      await api("logout", {});
      setUser(null);
      router.push(isAdmin ? "/admin/login" : "/student/login");
      router.refresh();
    } catch (e: any) {
      toast(e.message, true);
    }
  };
  const auth = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/student/login",
    "/student/register",
    "/admin/login",
    "/admin/register",
  ].includes(pathname);
  const landing =
    pathname === "/" ||
    ["/about", "/contact", "/privacy", "/terms"].includes(pathname);
  const page = missing ? (
    <Empty
      title="This page isn’t in the syllabus."
      text="The page you’re looking for could not be found."
      action="Back to dashboard"
      href="/dashboard"
    />
  ) : pathname === "/dashboard" || pathname === "/student" ? (
    <Dashboard />
  ) : pathname === "/explore" || pathname === "/search" ? (
    <Explore />
  ) : pathname === "/library" ||
    pathname === "/bookmarks" ||
    pathname === "/uploads" ? (
    <LibraryPage key={pathname} mode={pathname.slice(1)} />
  ) : pathname === "/upload" ? (
    <Upload />
  ) : pathname === "/profile" || pathname === "/settings" ? (
    <Profile settings={pathname === "/settings"} />
  ) : pathname === "/notifications" ? (
    <Notifications />
  ) : pathname === "/admin" ? (
    <Admin />
  ) : pathname.startsWith("/notes/") ? (
    <NoteDetail key={pathname} id={pathname.split("/")[2]} />
  ) : (
    <Empty />
  );
  return (
    <Context.Provider value={{ user, setUser, toast }}>
      {auth ? (
        <Auth />
      ) : landing ? (
        <Landing
          legal={pathname !== "/" ? pathname.slice(1) : ""}
          toggleTheme={toggleTheme}
          dark={dark}
        />
      ) : (
        <div className={"app-shell " + (collapsed ? "collapsed" : "")}>
          <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
            <Link href={isAdmin ? "/admin" : "/student"} className="brand">
              <span className="brand-symbol">
                <BookOpen size={23} />
              </span>
              {!collapsed && (
                <span>
                  NoteSphere<span className="brand-dot">.</span>
                </span>
              )}
            </Link>
            <button
              className="workspace-selector"
              onClick={() => router.push("/profile")}
            >
              <span className="workspace-icon">
                <GraduationCap size={18} />
              </span>
              {!collapsed && (
                <>
                  <span>
                    <strong>{user?.college || "Your student space"}</strong>
                    <small>
                      {user?.course
                        ? "Your learning workspace"
                        : "Complete your profile"}
                    </small>
                  </span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
            {!collapsed && <div className="nav-label">WORKSPACE</div>}
            <nav>
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    "nav-item " + (pathname === n.href ? "active" : "")
                  }
                  title={n.label}
                >
                  <n.icon size={19} />
                  {!collapsed && <span>{n.label}</span>}
                  {pathname === n.href && !collapsed && (
                    <span className="nav-active-dot" />
                  )}
                </Link>
              ))}
            </nav>
            {!collapsed && (
              <div className="sidebar-share">
                <span className="share-icon">
                  <Sparkles size={20} />
                </span>
                <h3>
                  Good notes deserve
                  <br />
                  great company.
                </h3>
                <p>
                  Share what you know.
                  <br />
                  {isAdmin
                    ? "Help someone grow."
                    : "Your admin reviews it first."}
                </p>
                <Link href="/upload" className="btn sidebar-upload">
                  <Plus size={15} />
                  Upload a PDF
                </Link>
              </div>
            )}
            <div className="sidebar-bottom">
              <Link
                href="/notifications"
                className={
                  "nav-item " + (pathname === "/notifications" ? "active" : "")
                }
              >
                <Bell size={19} />
                {!collapsed && "Notifications"}
              </Link>
              <Link href="/settings" className="nav-item">
                <Settings size={19} />
                {!collapsed && "Settings"}
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="nav-item">
                  <ShieldCheck size={19} />
                  {!collapsed && "Admin console"}
                </Link>
              )}
              <button
                className="nav-item"
                onClick={toggleTheme}
                title="Toggle color theme"
              >
                {dark ? <Sun size={19} /> : <Moon size={19} />}
                <span>{!collapsed && (dark ? "Light mode" : "Dark mode")}</span>
              </button>
              {user ? (
                <div className="sidebar-user">
                  <Link href="/profile">
                    <Avatar user={user} size={36} />
                  </Link>
                  {!collapsed && (
                    <>
                      <Link href="/profile" className="sidebar-user-name">
                        <strong>{user.name}</strong>
                        <small>
                          {isAdmin ? "Administrator" : "Student account"}
                        </small>
                      </Link>
                      <button
                        className="icon-btn"
                        onClick={logout}
                        title="Log out"
                        aria-label="Log out"
                      >
                        <LogOut size={16} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <Link className="btn primary" href="/login">
                  Sign in
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </aside>
          {mobile && (
            <button
              className="sidebar-backdrop"
              aria-label="Close menu"
              onClick={() => setMobile(false)}
            />
          )}
          <div className="main-shell">
            <header className="topbar">
              <div className="inline">
                <button
                  className="icon-btn desktop-only"
                  aria-label="Toggle sidebar"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? (
                    <PanelLeft size={19} />
                  ) : (
                    <PanelLeftClose size={19} />
                  )}
                </button>
                <button
                  className="icon-btn mobile-only"
                  aria-label="Open menu"
                  onClick={() => setMobile(!mobile)}
                >
                  <Menu size={20} />
                </button>
                <span className="breadcrumb">
                  Workspace <span>/</span>{" "}
                  <strong>
                    {pathname.startsWith("/notes/")
                      ? "Note details"
                      : pathname === "/library"
                        ? "My library"
                        : pathname === "/uploads"
                          ? "My uploads"
                          : pathname
                              .slice(1)
                              .replace(/^./, (s) => s.toUpperCase())}
                  </strong>
                </span>
              </div>
              <div className="topbar-right">
                <form className="global-search" action="/explore">
                  <Search size={16} />
                  <input
                    name="q"
                    placeholder="Search your next breakthrough…"
                    aria-label="Search notes"
                  />
                  <span>↵</span>
                </form>
                <Link
                  className="notification-icon icon-btn"
                  href={user ? "/notifications" : "/login"}
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                </Link>
                {user && (
                  <Link href="/profile">
                    <Avatar user={user} size={32} />
                  </Link>
                )}
              </div>
            </header>
            <main className="content">
              {page}
              <footer className="app-footer">
                <span>Made for curious minds.</span>
                <span>
                  NoteSphere <span className="footer-dot">✦</span> Learn better,
                  together.
                </span>
              </footer>
            </main>
          </div>
        </div>
      )}
      {notice && (
        <div
          className={"toast " + (notice.error ? "toast-error" : "")}
          role="status"
        >
          {notice.error ? <X size={19} /> : <CheckCircle2 size={19} />}
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
function Landing({
  legal,
  toggleTheme,
  dark,
}: {
  legal: string;
  toggleTheme: () => void;
  dark: boolean;
}) {
  const { user } = useApp();
  const remote = useRemote(user ? "notes?sort=recent" : null);
  const copy: Record<string, { title: string; text: string }> = {
    about: {
      title: "Learning gets better when we share.",
      text: "NoteSphere is a college project built to bring academic notes into one thoughtful, searchable workspace. Students stay in control of their contributions and personal collections.",
    },
    contact: {
      title: "Let’s stay connected.",
      text: "For access, moderation or support, contact the administrator who operates your college’s NoteSphere installation. Administrators can review reported notes and reviews in the admin console.",
    },
    privacy: {
      title: "Your learning space is personal.",
      text: "We store account details, uploaded documents, bookmarks, reviews and reading events to provide the service. Private notes and collections are restricted to their owner. Public notes become discoverable after approval. Passwords are hashed using scrypt. The installation administrator operates the database and storage. Delete your notes through My uploads; contact the administrator for account removal and retention details. This project does not include third-party advertising or analytics.",
    },
    terms: {
      title: "Share responsibly. Learn together.",
      text: "Upload only material you own or are authorized to share. Do not upload private personal information, abusive content, copyrighted textbooks without permission, or exam material whose distribution is restricted. Reviews must be constructive. Administrators may reject or remove content. Report concerns on a note’s detail page. This academic project is provided as-is by its installation operator.",
    },
  };
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <BookOpen size={23} />
          </span>
          NoteSphere<span className="brand-dot">.</span>
        </Link>
        <nav>
          <Link href="/explore">Explore notes</Link>
          <Link href="/#how-it-works">How it works</Link>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link className="btn" href="/admin/login">
            Admin sign in
          </Link>
          <Link className="btn primary" href="/student/login">
            Student sign in
            <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
      {legal ? (
        <section className="legal panel">
          <span className="eyebrow">NOTESPHERE / {legal.toUpperCase()}</span>
          <h1>{copy[legal]?.title}</h1>
          <p>{copy[legal]?.text}</p>
          <Link href="/" className="text-link">
            Back home
            <ArrowRight size={15} />
          </Link>
        </section>
      ) : (
        <>
          <section className="landing-hero">
            <div>
              <span className="pill">
                <span className="live-dot" />A little sharing. A lot of
                learning.
              </span>
              <h1>
                Your College Notes,
                <br />
                <em>All in One Place.</em>
              </h1>
              <p>
                From last-minute revision to your next big idea.
                <br className="desktop-only" />
                Find great notes, share your knowledge, and learn better
                together.
              </p>
              <form className="hero-search" action="/explore">
                <Search size={21} />
                <input
                  name="q"
                  aria-label="Search academic notes"
                  placeholder="What are you learning today?"
                />
                <button className="btn primary">
                  Find notes
                  <ArrowRight size={16} />
                </button>
              </form>
              <div className="inline hero-actions">
                <Link className="text-link" href="/explore">
                  Explore notes
                  <ArrowRight size={16} />
                </Link>
                <span className="muted">or</span>
                <Link className="text-link" href="/upload">
                  Upload a PDF
                  <UploadCloud size={16} />
                </Link>
              </div>
              <div className="hero-values">
                <span>
                  <CheckCircle2 size={14} />
                  Your college, connected
                </span>
                <span>
                  <CheckCircle2 size={14} />
                  Organized around you
                </span>
              </div>
            </div>
            <BookIllustration large />
          </section>
          <section
            className="portal-choices"
            aria-label="Choose your account portal"
          >
            <article className="panel portal-entry">
              <span className="compact-icon lavender">
                <GraduationCap size={24} />
              </span>
              <h2>Student portal</h2>
              <p>
                Discover campus PDFs, share notes for admin approval, and keep
                your learning organized.
              </p>
              <div className="inline">
                <Link href="/student/login" className="btn primary">
                  Student sign in
                  <ArrowRight size={15} />
                </Link>
                <Link href="/student/register" className="text-link">
                  Create student account
                </Link>
              </div>
            </article>
            <article className="panel portal-entry">
              <span className="compact-icon mint">
                <ShieldCheck size={24} />
              </span>
              <h2>Admin portal</h2>
              <p>
                Upload PDF notes for students, review activity, and manage your
                learning space.
              </p>
              <div className="inline">
                <Link href="/admin/login" className="btn primary">
                  Admin sign in
                  <ArrowRight size={15} />
                </Link>
                <Link href="/admin/register" className="text-link">
                  Create admin account
                </Link>
              </div>
            </article>
          </section>
          <div className="landing-strip">
            <span>A home for every subject.</span>
            <span>COMPUTER SCIENCE</span>
            <span>ENGINEERING</span>
            <span>MATHEMATICS</span>
            <span>AND YOUR NEXT CHAPTER ↗</span>
          </div>
          <section className="landing-section" id="how-it-works">
            <span className="eyebrow">LESS SEARCHING. MORE LEARNING.</span>
            <div className="between">
              <h2>A smarter way to study.</h2>
              <p>
                Everything you need.
                <br />
                All beautifully connected.
              </p>
            </div>
            <div className="feature-grid">
              {[
                {
                  icon: Compass,
                  title: "Find your next “aha”.",
                  text: "Search by subject, semester, topic and tags. Great notes are just a few clicks away.",
                },
                {
                  icon: Library,
                  title: "Make room for knowledge.",
                  text: "Save your favorites. Build private collections. Pick up exactly where you left off.",
                },
                {
                  icon: UploadCloud,
                  title: "Notes from your admin.",
                  text: "Students share PDFs for admin approval. Approved notes are available to signed-in students.",
                },
              ].map((f, i) => (
                <article className="feature" key={f.title}>
                  <span className="feature-number">0{i + 1}</span>
                  <f.icon size={25} />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="landing-section">
            <Section
              title="Your course PDFs, kept private."
              sub="Uploaded by administrators. Available to registered students."
              href="/explore"
            >
              {remote.loading ? (
                <Skeleton />
              ) : remote.data?.notes.length ? (
                <div className="note-grid">
                  {remote.data.notes.slice(0, 3).map((n: any) => (
                    <NoteCard key={n.id} note={n} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="Great things start with a single note."
                  text="Sign in to the student portal to receive and read your administrator’s PDFs."
                  action="Student sign in"
                  href="/student/login"
                />
              )}
            </Section>
          </section>
          <section className="community-cta">
            <div>
              <span className="eyebrow">THE NEXT GREAT CONTRIBUTOR? YOU.</span>
              <h2>
                What you know could
                <br />
                be someone’s breakthrough.
              </h2>
              <p>Your notes have more to give. Share them with your campus.</p>
              <Link className="btn primary" href="/register">
                Join NoteSphere
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="cta-stamp">
              <GraduationCap size={56} />
              <span>
                MADE FOR
                <br />
                CURIOUS MINDS
              </span>
            </div>
          </section>
        </>
      )}
      <footer className="landing-footer">
        <Link className="brand" href="/">
          <BookOpen size={20} />
          NoteSphere.
        </Link>
        <span>Learn better, together.</span>
        <nav>
          {["About", "Contact", "Privacy", "Terms"].map((l) => (
            <Link key={l} href={"/" + l.toLowerCase()}>
              {l === "Privacy" ? "Privacy Policy" : l}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
export function BookIllustration({ large = false }: { large?: boolean }) {
  return (
    <div
      className={"book-illustration " + (large ? "large" : "")}
      aria-hidden="true"
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="illustration-spark spark-one">✦</div>
      <div className="illustration-spark spark-two">✧</div>
      <span className="illustration-dot dot-one" />
      <span className="illustration-dot dot-two" />
      <div className="floating-label">
        <span className="live-dot" />
        One idea. Endless possibilities.
      </div>
      <div className="book book-back">
        <div className="book-spine" />
        <span>
          STAY
          <br />
          CURIOUS.
        </span>
        <BookOpen size={29} />
      </div>
      <div className="book book-front">
        <div className="book-spine" />
        <span>
          THE NEXT
          <br />
          CHAPTER<span className="book-small">starts with a note.</span>
        </span>
        <div className="book-flower">✳</div>
      </div>
      <div className="book-shadow" />
      <div className="illustration-caption">
        <span>↑</span>Knowledge looks good on you.
      </div>
    </div>
  );
}
