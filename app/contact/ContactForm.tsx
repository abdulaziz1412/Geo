"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("يرجى تعبئة الاسم والبريد والرسالة.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
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
        <strong>وصلتنا رسالتك.</strong>
        <span>شكراً لتواصلك معنا، سنردّ على بريدك في أقرب وقت.</span>
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={submit} noValidate>
      <input className="field" type="text" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} aria-label="الاسم" />
      <input className="field" type="email" dir="ltr" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="البريد الإلكتروني" />
      <textarea className="field" rows={5} placeholder="رسالتك" value={message} onChange={(e) => setMessage(e.target.value)} aria-label="الرسالة" />
      <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "جارٍ الإرسال…" : "إرسال الرسالة"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
