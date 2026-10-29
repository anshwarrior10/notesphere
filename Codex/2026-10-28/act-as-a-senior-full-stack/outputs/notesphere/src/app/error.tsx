"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>We couldn’t load this page.</h1>
      <p>Your notes are safe. Try loading the page again.</p>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
      <a href="/dashboard">Back to dashboard</a>
    </main>
  );
}
