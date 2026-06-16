import { NextRequest, NextResponse } from "next/server";

// Captures a free-audit / waitlist request.
// No external keys needed yet — for now it validates and accepts the lead.
// TODO (final step): persist to the database and/or send a notification email.
export async function POST(req: NextRequest) {
  let body: { email?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const website = (body.website ?? "").trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    return NextResponse.json({ error: "invalid email" }, { status: 422 });
  }

  console.log("[waitlist] new lead:", { email, website, at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
