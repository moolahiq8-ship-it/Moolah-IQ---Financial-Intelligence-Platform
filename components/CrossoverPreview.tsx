"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/*
 * Math is replicated EXACTLY from components/CrossoverCalculator.tsx
 * (the /tools/crossover-calculator page) — that tool is the source of
 * truth. Same constants, same end-of-month contribution timing, same
 * crossover condition. The preview fixes currentAssets at 0 (no slider).
 */
const MAX_YEARS = 50;
const SAFE_WITHDRAWAL_RATE = 0.04;

function computeCrossover(
  currentAssets: number,
  monthlyInvestment: number,
  annualReturn: number,
  monthlyExpenses: number
): { month: number; portfolio: number } {
  const monthlyRate = annualReturn / 100 / 12;
  const maxMonths = MAX_YEARS * 12;
  let balance = currentAssets;
  for (let m = 0; m <= maxMonths; m++) {
    if (m > 0) {
      balance = balance * (1 + monthlyRate) + monthlyInvestment;
    }
    const passiveIncome = (balance * SAFE_WITHDRAWAL_RATE) / 12;
    if (passiveIncome >= monthlyExpenses) {
      return { month: m, portfolio: balance };
    }
  }
  return { month: -1, portfolio: 0 };
}

// Same first-of-month anchor as the full calculator's monthToDate(),
// short month name per the preview spec ("Feb 2057").
function monthToShortDate(month: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + month, 1);
  return target.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const SLIDER_CLASS = "w-full slider-touch cursor-pointer block";

export default function CrossoverPreview() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(3400);
  const [monthlyInvestment, setMonthlyInvestment] = useState(800);
  const [annualReturn, setAnnualReturn] = useState(7);

  const { month, portfolio } = useMemo(
    () => computeCrossover(0, monthlyInvestment, annualReturn, monthlyExpenses),
    [monthlyInvestment, annualReturn, monthlyExpenses]
  );

  const reached = month >= 0;

  return (
    <section id="tool" className="bg-primary scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-14 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — pitch */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-light mb-3">
              Interactive tool
            </p>
            <h2
              className="text-3xl md:text-[38px]/[1.2] font-extrabold text-white mb-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Find your crossover point — right here.
            </h2>
            <p className="text-base leading-relaxed text-[#C7D6EA] max-w-lg mb-8">
              Drag the sliders. The date your passive investment income covers
              your monthly expenses updates live — your personal financial
              independence day.
            </p>
            <Link
              href="/tools/crossover-calculator"
              className="inline-block bg-gold hover:bg-gold-dark text-primary font-bold text-[15px] px-7 py-3.5 rounded-full transition-colors"
            >
              Open the full calculator
            </Link>
          </div>

          {/* Right — glass card */}
          <div className="lg:justify-self-end w-full max-w-lg rounded-[18px] p-7 bg-white/[0.06] border border-white/[0.14]">
            <div className="space-y-6">
              {/* Monthly expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="preview-expenses"
                    className="text-sm text-[#C7D6EA]"
                  >
                    Monthly expenses
                  </label>
                  <span className="text-[15px] font-bold text-white">
                    {formatFullCurrency(monthlyExpenses)}/mo
                  </span>
                </div>
                <input
                  id="preview-expenses"
                  type="range"
                  min={1000}
                  max={10000}
                  step={100}
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  className={SLIDER_CLASS}
                />
              </div>

              {/* Invested per month */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="preview-invest"
                    className="text-sm text-[#C7D6EA]"
                  >
                    Invested per month
                  </label>
                  <span className="text-[15px] font-bold text-white">
                    {formatFullCurrency(monthlyInvestment)}/mo
                  </span>
                </div>
                <input
                  id="preview-invest"
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className={SLIDER_CLASS}
                />
              </div>

              {/* Expected annual return */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="preview-return"
                    className="text-sm text-[#C7D6EA]"
                  >
                    Expected annual return
                  </label>
                  <span className="text-[15px] font-bold text-white">
                    {annualReturn}%
                  </span>
                </div>
                <input
                  id="preview-return"
                  type="range"
                  min={3}
                  max={12}
                  step={0.5}
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(Number(e.target.value))}
                  className={SLIDER_CLASS}
                />
              </div>
            </div>

            {/* Result row */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.14] mt-7 pt-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8FA6C6] mb-1">
                  Your crossover date
                </p>
                <p
                  className={`font-extrabold text-gold-light ${
                    reached ? "text-[30px]" : "text-[22px]"
                  } leading-tight`}
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {reached ? monthToShortDate(month) : "50+ years away"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8FA6C6] mb-1">
                  Portfolio needed
                </p>
                <p className="text-xl font-bold text-white leading-tight">
                  {reached ? formatFullCurrency(portfolio) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
