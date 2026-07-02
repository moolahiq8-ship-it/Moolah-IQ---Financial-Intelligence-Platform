"use client";

import { useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  {
    question: "Do you have one month of expenses set aside for emergencies?",
    options: [
      { label: "Not yet — living paycheck to paycheck", value: 0 },
      { label: "Getting there — some savings, no system", value: 1 },
      { label: "Yes — 3+ months, fully funded", value: 2 },
    ],
  },
  {
    question: "How would you describe your investing experience?",
    options: [
      { label: "Haven't started investing yet", value: 0 },
      { label: "I have a retirement account but don't manage it", value: 1 },
      { label: "I invest regularly in index funds or similar", value: 2 },
    ],
  },
  {
    question: "Do you know what the 4% rule is?",
    options: [
      { label: "Never heard of it", value: 0 },
      { label: "Heard of it, couldn't explain it", value: 1 },
      { label: "Yes — I could explain it to a friend", value: 2 },
    ],
  },
];

// score 0–6 → tier result
function getResult(score: number) {
  if (score <= 2) {
    return {
      iq: 95,
      tier: "Foundations",
      cta: "Start with the budgeting guide",
      href: "/blog/getting-started-with-budgeting",
    };
  }
  if (score <= 4) {
    return {
      iq: 110,
      tier: "Strategy",
      cta: "Read Investing 101",
      href: "/blog/investing-101",
    };
  }
  return {
    iq: 140,
    tier: "Mastery",
    cta: "Browse Mastery guides",
    href: "/category/optimize",
  };
}

export default function MoneyIQQuiz() {
  const [step, setStep] = useState(0); // 0–3; 3 = result view
  const [score, setScore] = useState(0); // 0–6

  const answer = (value: number) => {
    setScore(score + value);
    setStep(step + 1);
  };

  const retake = () => {
    setStep(0);
    setScore(0);
  };

  const done = step >= QUESTIONS.length;
  const result = done ? getResult(score) : null;

  return (
    <section id="quiz" className="bg-primary scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — pitch */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-light mb-3">
              60-second quiz
            </p>
            <h2
              className="text-3xl md:text-[38px]/[1.2] font-extrabold text-white mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              What&apos;s your Money IQ?
            </h2>
            <p className="text-base leading-relaxed text-[#C7D6EA] max-w-lg">
              Three questions place you on the scale and point you to the
              right first guide. No email required — your result is instant.
            </p>
          </div>

          {/* Right — quiz card */}
          <div className="bg-white rounded-2xl p-7 lg:justify-self-end w-full max-w-lg">
            {!done ? (
              <div>
                {/* Progress */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[13px] text-slate-500">
                    Question {step + 1} of {QUESTIONS.length}
                  </p>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {QUESTIONS.map((_, i) => (
                      <span
                        key={i}
                        className={`w-6 h-1.5 rounded-full ${
                          i <= step ? "bg-accent" : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-primary mb-5">
                  {QUESTIONS[step].question}
                </h3>

                <div className="space-y-3">
                  {QUESTIONS[step].options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => answer(option.value)}
                      className="w-full text-left border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-dark-text transition-colors hover:border-accent hover:bg-emerald-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              result && (
                <div className="text-center py-2">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Your Money IQ
                  </p>
                  <p
                    className="text-6xl font-extrabold text-primary mb-1"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {result.iq}
                  </p>
                  <p className="text-lg font-bold text-gold-dark mb-6">
                    {result.tier}
                  </p>
                  <Link
                    href={result.href}
                    className="inline-block bg-accent hover:bg-primary text-white font-bold text-[15px] px-7 py-3.5 rounded-full transition-colors"
                  >
                    {result.cta}
                  </Link>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={retake}
                      className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                      Retake quiz
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
