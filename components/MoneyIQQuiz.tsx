"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPillar, type PillarSlug } from "@/lib/pillars";

// "Find your starting point" (2026-09-23). Three questions -> guide suggestions from
// EXISTING articles, based on topic interest, familiarity and preferred depth. There is
// no score: nothing here rates the reader, their savings or their suitability for
// trading, and an interest in trading never routes a newcomer to advanced material.
// No email required; the result is instant.

type Familiarity = "new" | "basics" | "comfortable";
type Depth = "overview" | "walkthrough" | "detailed";

export interface QuizGuide {
  title: string;
  readingTime: string;
  /** GROW / PROTECT / OPTIMIZE for mapped articles, else the category (lib/pillars.ts) */
  label: string;
}

const QUESTIONS = [
  {
    key: "interest",
    question: "Which area do you want to start with?",
    options: [
      { label: "Growing my money: trading and investing", value: "grow" },
      { label: "Protecting my family and assets: insurance and fraud", value: "protect" },
      { label: "Making my finances work harder: debt, credit, and costs", value: "optimize" },
    ],
  },
  {
    key: "familiarity",
    question: "How familiar are you with that topic?",
    options: [
      { label: "It's new to me", value: "new" },
      { label: "I know the basics", value: "basics" },
      { label: "I'm comfortable and want more depth", value: "comfortable" },
    ],
  },
  {
    key: "depth",
    question: "How would you like your first guide?",
    options: [
      { label: "A short, practical overview", value: "overview" },
      { label: "A step-by-step walkthrough", value: "walkthrough" },
      { label: "A detailed framework to work through", value: "detailed" },
    ],
  },
] as const;

/** Suggested guides (slugs of existing articles). Exported for testing. */
export function recommend(interest: PillarSlug, familiarity: Familiarity, depth: Depth): { primary: string; also: string | null } {
  if (interest === "grow") {
    // Both current GROW guides are foundations for later trading material; a newcomer or
    // an overview reader starts with Investing 101, others with risk-first position sizing.
    return familiarity === "new" || depth === "overview"
      ? { primary: "investing-101", also: "size-your-first-investments" }
      : { primary: "size-your-first-investments", also: "investing-101" };
  }
  if (interest === "protect") {
    return { primary: "vet-online-income-opportunity", also: null };
  }
  if (familiarity === "new") {
    return { primary: "getting-started-with-budgeting", also: "cut-three-bills-without-giving-anything-up" };
  }
  if (depth === "overview") {
    return { primary: "ask-credit-card-issuer-for-lower-rate", also: "cut-three-bills-without-giving-anything-up" };
  }
  if (depth === "walkthrough") {
    return { primary: "debt-avalanche-vs-debt-snowball-run-your-own-numbers-first", also: "ask-credit-card-issuer-for-lower-rate" };
  }
  return { primary: "three-ways-pay-off-mortgage-years-early-without-refinancing", also: "debt-avalanche-vs-debt-snowball-run-your-own-numbers-first" };
}

export default function MoneyIQQuiz({ guides }: { guides: Record<string, QuizGuide> }) {
  const [answers, setAnswers] = useState<string[]>([]);
  const step = answers.length;
  const done = step >= QUESTIONS.length;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);

  // Keyboard/screen-reader users: move focus to the new question (or the result) after
  // each answer, so the next choice is reachable without hunting for it.
  useEffect(() => {
    if (!started.current) return;
    headingRef.current?.focus();
  }, [step]);

  const answer = (value: string) => {
    started.current = true;
    setAnswers([...answers, value]);
  };
  const retake = () => {
    started.current = true;
    setAnswers([]);
  };

  const result = done
    ? recommend(answers[0] as PillarSlug, answers[1] as Familiarity, answers[2] as Depth)
    : null;
  const pillar = done ? getPillar(answers[0]) : undefined;

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
              Find your starting point.
            </h2>
            <p className="text-base leading-relaxed text-[#C7D6EA] max-w-lg">
              Answer three quick questions to find guides that match your
              interests and experience. No email required &mdash; your
              suggestions are instant.
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
                        className={`w-6 h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <h3 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-primary mb-5 outline-none">
                  {QUESTIONS[step].question}
                </h3>

                <div className="space-y-3">
                  {QUESTIONS[step].options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => answer(option.value)}
                      className="w-full text-left border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-dark-text transition-colors hover:border-accent hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              result && (
                <div className="py-2">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Your starting point
                  </p>
                  <h3
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-2xl font-extrabold text-primary mb-5 outline-none"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {pillar?.label}
                  </h3>
                  <Link
                    href={`/blog/${result.primary}`}
                    className="block rounded-xl bg-accent hover:bg-primary text-white px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <span className="block text-[12px] font-bold uppercase tracking-wider text-white/80">
                      Start with · {guides[result.primary]?.label} · {guides[result.primary]?.readingTime}
                    </span>
                    <span className="block text-[16px] font-bold leading-snug">{guides[result.primary]?.title}</span>
                  </Link>
                  {result.also && (
                    <p className="mt-4 text-[14px] text-slate-600">
                      Also useful:{" "}
                      <Link href={`/blog/${result.also}`} className="font-semibold text-accent hover:text-primary underline-offset-2 hover:underline">
                        {guides[result.also]?.title}
                      </Link>{" "}
                      <span className="text-[12px] font-bold tracking-wide text-slate-500">({guides[result.also]?.label})</span>
                    </p>
                  )}
                  <p className="mt-2 text-[14px] text-slate-600">
                    <Link href={`/pillar/${pillar?.slug}`} className="font-semibold text-accent hover:text-primary underline-offset-2 hover:underline">
                      Browse all {pillar?.label} guides
                    </Link>
                  </p>
                  <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
                    Suggestions are based only on the topic and learning style you chose. Educational content, not advice.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={retake}
                      className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
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
