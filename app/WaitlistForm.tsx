"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("اكتب بريدك الإلكتروني لنرسل لك التقرير.");
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
      setError("تعذّر الإرسال الآن. حاول مرة أخرى بعد قليل.");
    }
  }

  if (status === "done") {
    return (
      <div className="form-done">
        <strong>وصلنا طلبك.</strong>
        <span>سنحلّل ظهور موقعك في إجابات الذكاء الاصطناعي ونرسل لك التقرير على بريدك.</span>
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
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="البريد الإلكتروني"
      />
      <input
        className="field"
        type="text"
        dir="ltr"
        placeholder="yourbrand.com"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-label="رابط الموقع"
      />
      <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "جارٍ الإرسال…" : "أرسِل لي التقرير المجاني"}
      </button>
      {error && <p className="form-error">{error}</p>}
      <p className="form-note">مجاني تماماً. بريدك لن يُشارك مع أحد.</p>
    </form>
  );
}
