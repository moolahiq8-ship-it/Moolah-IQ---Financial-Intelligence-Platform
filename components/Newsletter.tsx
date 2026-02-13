"use client";

import { useState } from "react";

interface NewsletterProps {
  variant?: "hero" | "footer" | "inline";
}

export default function Newsletter({ variant = "inline" }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — wire to Mailchimp, ConvertKit, etc.
    setSubmitted(true);
    setEmail("");
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
        Thanks for subscribing!
      </p>
    );
  }

  const isOnDark = variant === "footer";

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className={`flex-1 px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-gold transition-shadow ${
          isOnDark
            ? "bg-white/10 border-white/20 text-white placeholder-white/40"
            : "bg-white border-gray-200 text-dark-text placeholder-gray-400 shadow-sm"
        }`}
      />
      <button
        type="submit"
        className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-3 rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm"
      >
        Subscribe
      </button>
    </form>
  );
}
