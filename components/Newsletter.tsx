"use client";

import { useState } from "react";

interface NewsletterProps {
  variant?: "hero" | "footer" | "inline" | "brief";
}

export default function Newsletter({ variant = "inline" }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p
        className={
          variant === "footer"
            ? "text-gold-light text-sm font-medium"
            : variant === "brief"
              ? "text-accent text-sm font-semibold"
              : "text-gold font-semibold"
        }
      >
        Thanks for subscribing! Check your inbox to confirm and grab your free
        checklist.
      </p>
    );
  }

  const isOnDark = variant === "footer";
  const isBrief = variant === "brief";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className={`flex gap-3 ${isBrief ? "flex-wrap" : ""}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          className={`text-sm border focus:outline-none focus:ring-2 transition-shadow disabled:opacity-60 ${
            isBrief
              ? // Spec: radius 999px, border #CBD5E1, bg light-bg, 14px 18px, max 320px
                "w-full max-w-[320px] px-[18px] py-3.5 rounded-full border-slate-300 bg-light-bg text-dark-text placeholder-slate-400 focus:ring-accent focus:border-accent"
              : `flex-1 px-4 py-3 rounded-lg focus:ring-gold ${
                  isOnDark
                    ? "bg-white/10 border-white/20 text-white placeholder-white/40"
                    : "bg-white border-gray-200 text-dark-text placeholder-gray-400 shadow-md"
                }`
          }`}
        />
        {/* Honeypot: hidden from real users, catches bots. Not display:none so
            some bots still fill it; positioned off-screen and hidden from a11y. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
        />
        <button
          type="submit"
          disabled={loading}
          className={`text-sm transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
            isBrief
              ? "bg-primary hover:bg-accent text-white font-semibold px-6 py-3.5 rounded-full"
              : "bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-3 rounded-lg shadow-md"
          }`}
        >
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {error && (
        <p
          className={
            isOnDark
              ? "text-red-300 text-xs font-medium"
              : "text-red-600 text-xs font-medium"
          }
        >
          {error}
        </p>
      )}
    </form>
  );
}
