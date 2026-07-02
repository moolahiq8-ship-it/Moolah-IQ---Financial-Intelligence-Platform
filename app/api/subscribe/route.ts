import { NextRequest, NextResponse } from "next/server";

// Run on the Node.js runtime so the secret API key is only ever read
// server-side and never shipped to the browser.
export const runtime = "nodejs";

// Basic, pragmatic email shape check. Beehiiv does its own validation too;
// this just rejects obvious garbage before we spend an API call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  // Honeypot: real users never fill the hidden "website" field. If it has a
  // value, silently pretend success so bots don't learn they were caught —
  // and never touch Beehiiv.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) {
    // Misconfiguration — log server-side, stay vague to the client.
    console.error(
      "Newsletter subscribe: BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID is not set."
    );
    return NextResponse.json(
      { ok: false, error: "Subscriptions are temporarily unavailable." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${encodeURIComponent(
        publicationId
      )}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "moolahiq.com",
          utm_medium: "website_signup",
        }),
      }
    );

    if (!res.ok) {
      // Don't leak Beehiiv's raw response to the client; log it for us.
      const detail = await res.text().catch(() => "");
      console.error(
        `Newsletter subscribe: Beehiiv responded ${res.status}. ${detail}`
      );
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter subscribe: request to Beehiiv failed.", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 502 }
    );
  }
}
