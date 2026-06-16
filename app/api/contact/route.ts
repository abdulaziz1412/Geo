import { NextRequest, NextResponse } from "next/server";

// Receives a contact-form message. No external keys needed yet.
// TODO (final step): forward to email and/or store in the database.
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !valid || !message) {
    return NextResponse.json({ error: "invalid input" }, { status: 422 });
  }

  console.log("[contact] new message:", { name, email, message, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
