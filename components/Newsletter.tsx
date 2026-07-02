"use client";

import { useState } from "react";

interface NewsletterProps {
  variant?: "hero" | "footer" | "inline";
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
            : "text-gold font-semibold"
        }
      >
        Thanks for subscribing! Check your inbox to confirm and grab your free
        checklist.
      </p>
    );
  }

  const isOnDark = variant === "footer";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={loading}
          className={`flex-1 px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-gold transition-shadow disabled:opacity-60 ${
            isOnDark
              ? "bg-white/10 border-white/20 text-white placeholder-white/40"
              : "bg-white border-gray-200 text-dark-text placeholder-gray-400 shadow-md"
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
          className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-3 rounded-lg text-sm transition-colors whitespace-nowrap shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
