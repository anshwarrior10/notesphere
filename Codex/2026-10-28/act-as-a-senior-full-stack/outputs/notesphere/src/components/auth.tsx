"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useApp, useRemote, api, Busy } from "./ui";
import { BookIllustration } from "./app";
export function Auth() {
  const config = useRemote("config");
  const path = usePathname(),
    router = useRouter(),
    { setUser, toast } = useApp();
  const admin = path.startsWith("/admin/");
  const portal = admin ? "admin" : "student";
  const loginPath = `/${portal}/login`,
    registerPath = `/${portal}/register`;
  const register = path.endsWith("/register"),
    forgot = path === "/forgot-password",
    reset = path === "/reset-password";
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [sent, setSent] = useState(""),
    [email, setEmail] = useState(""),
    [token, setToken] = useState("");
  useEffect(() => {
    setError("");
    setSent("");
    setEmail("");
    setToken(new URLSearchParams(location.search).get("token") || "");
  }, [path]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const b = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (forgot) {
        const r = await api("forgot-password", b);
        setSent(r.message);
      } else if (reset) {
        await api("reset-password", { ...b, token });
        toast("Password updated. Sign in with your new password.");
        router.push("/login");
      } else {
        await api(
          register ? (admin ? "admin/register" : "register") : "login",
          { ...b, portal },
        );
        const account = (await api("me")).user;
        setUser(account);
        router.push(account.role === "admin" ? "/admin" : "/student");
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-art">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <BookOpen size={23} />
          </span>
          NoteSphere.
        </Link>
        <div className="auth-pitch">
          <span className="eyebrow">YOUR CAMPUS. CONNECTED.</span>
          <h1>
            A little knowledge.
            <br />A world of
            <br />
            <em>possibility.</em>
          </h1>
          <p>
            Your best study session starts here.
            <br />
            Great notes. Shared perspectives. Better learning.
          </p>
        </div>
        <BookIllustration />
        <p className="auth-footnote">
          <CheckCircle2 size={15} />
          Built for students, by the spirit of sharing.
        </p>
      </aside>
      <main className="auth-main">
        <Link className="auth-back text-link" href="/">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <div className="auth-form-wrap">
          {!forgot && !reset && (
            <nav className="portal-switch" aria-label="Account portal">
              <Link className={!admin ? "active" : ""} href="/student/login">
                Student portal
              </Link>
              <Link className={admin ? "active" : ""} href="/admin/login">
                Admin portal
              </Link>
            </nav>
          )}
          <span className="eyebrow">
            {register
              ? admin
                ? "CREATE AN ADMIN ACCOUNT"
                : "CREATE A STUDENT ACCOUNT"
              : forgot || reset
                ? "BACK ON TRACK"
                : admin
                  ? "ADMINISTRATOR ACCESS"
                  : "STUDENT ACCESS"}
          </span>
          <h1>
            {register
              ? admin
                ? "Create your admin account."
                : "Start your student journey."
              : forgot
                ? "Forgot your password?"
                : reset
                  ? "A fresh start."
                  : admin
                    ? "Welcome, administrator."
                    : "Welcome to your student sphere."}
          </h1>
          <p>
            {register
              ? admin
                ? "Use an invitation from an existing administrator to join."
                : "Create an account to discover notes and share your PDFs for admin approval."
              : forgot
                ? "We’ll send you a secure link to reset it."
                : reset
                  ? "Choose a strong new password for your account."
                  : admin
                    ? "Publish PDFs, manage students, and keep everyone learning."
                    : "Your campus notes, saved PDFs, and learning updates are waiting."}
          </p>
          {sent ? (
            <div className="success-message">
              <CheckCircle2 size={24} />
              {sent}
            </div>
          ) : (
            <form onSubmit={submit} key={path}>
              {register && (
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </label>
              )}
              {!reset && (
                <label>
                  {admin ? "Admin email" : "Student email"}
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@college.edu"
                  />
                </label>
              )}
              {register && admin && (
                <label>
                  Admin invitation code
                  <input
                    name="inviteCode"
                    required
                    minLength={20}
                    maxLength={100}
                    autoComplete="off"
                    placeholder="Paste your one-time invitation"
                  />
                  <small>
                    An existing admin can create invitations from the admin
                    page.
                  </small>
                </label>
              )}
              {!forgot && (
                <label>
                  <span className="between">
                    Password
                    {!register && !reset && (
                      <Link href="/forgot-password" className="text-link">
                        Forgot password?
                      </Link>
                    )}
                  </span>
                  <div className="password-input">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      required
                      minLength={register || reset ? 10 : 1}
                      maxLength={128}
                      autoComplete={
                        register || reset ? "new-password" : "current-password"
                      }
                      placeholder={
                        register || reset
                          ? "At least 10 characters"
                          : "Enter your password"
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {(register || reset) && (
                    <small>
                      Use at least 10 characters. A passphrase works well.
                    </small>
                  )}
                </label>
              )}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn primary full" disabled={busy}>
                {busy ? (
                  <Busy />
                ) : (
                  <>
                    {register
                      ? "Create your account"
                      : forgot
                        ? "Send reset link"
                        : reset
                          ? "Update password"
                          : "Sign in"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              {register && (
                <p className="form-fineprint">
                  By signing up, you agree to our{" "}
                  <Link href="/terms">Terms</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
              )}
            </form>
          )}
          <div className="auth-switch">
            {register ? (
              <>
                Already have an account? <Link href={loginPath}>Sign in</Link>
              </>
            ) : forgot || reset ? (
              <Link href={loginPath}>Back to sign in</Link>
            ) : (
              <>
                New around here?{" "}
                <Link href={registerPath}>Create an account</Link>
              </>
            )}
          </div>
          {!register && !forgot && !reset && config.data?.localDemo && (
            <details className="demo-access">
              <summary>
                {admin ? "Local demo admin" : "Four demo student accounts"}
              </summary>
              <p>
                These are demonstration accounts. Use the passwords supplied
                with this project; choose a name to fill its email.
              </p>
              {(admin
                ? [["NoteSphere Demo Admin", "admin@notesphere.test"]]
                : [
                    ["Sparsh Dwiwedi", "sparsh.dwiwedi@notesphere.test"],
                    ["Kundan Pathak", "kundan.pathak@notesphere.test"],
                    ["Shreshth Sharma", "shreshth.sharma@notesphere.test"],
                    ["Aahaan Jain", "aahaan.jain@notesphere.test"],
                  ]
              ).map(([name, address]) => (
                <button
                  className="demo-account"
                  type="button"
                  key={address}
                  onClick={() => setEmail(address)}
                >
                  <strong>{name}</strong>
                  <small>{address}</small>
                </button>
              ))}
            </details>
          )}
        </div>
        <span className="auth-copyright">
          NoteSphere · Learn better, together.
        </span>
      </main>
    </div>
  );
}
