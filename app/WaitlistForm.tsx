"use client";

import { useState } from "react";

type WL = {
  emailPh: string; sitePh: string; emailAria: string; siteAria: string;
  submit: string; sending: string; doneTitle: string; doneSub: string;
  errEmail: string; errSend: string; note: string;
};

export default function WaitlistForm({ t }: { t: WL }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t.errEmail);
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setStatus("error");
      setError(t.errSend);
    }
  }

  if (status === "done") {
    return (
      <div className="form-done">
        <strong>{t.doneTitle}</strong>
        <span>{t.doneSub}</span>
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={submit} noValidate>
      <input
        className="field"
        type="email"
        inputMode="email"
        dir="ltr"
        placeholder={t.emailPh}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label={t.emailAria}
      />
      <input
        className="field"
        type="text"
        dir="ltr"
        placeholder={t.sitePh}
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-label={t.siteAria}
      />
      <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? t.sending : t.submit}
      </button>
      {error && <p className="form-error">{error}</p>}
      <p className="form-note">{t.note}</p>
    </form>
  );
}
