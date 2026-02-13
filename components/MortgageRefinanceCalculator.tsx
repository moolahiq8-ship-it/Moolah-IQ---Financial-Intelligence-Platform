"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex ml-1.5 cursor-help">
      <svg
        className="w-4 h-4 text-gray-400 hover:text-primary transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-primary text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
      </span>
    </span>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px]">
      <p className="text-sm font-semibold text-primary mb-2">Month {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4 text-sm mb-1">
          <span style={{ color: entry.color }} className="font-medium">
            {entry.name}
          </span>
          <span className="text-dark-text font-semibold">
            {formatFullCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const TERM_OPTIONS = [15, 20, 30];

/** Standard monthly mortgage payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1] */
function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return years > 0 ? principal / (years * 12) : 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Total interest over life of loan */
function calcTotalInterest(principal: number, monthlyPayment: number, years: number): number {
  return monthlyPayment * years * 12 - principal;
}

export default function MortgageRefinanceCalculator() {
  // Current mortgage
  const [currentBalance, setCurrentBalance] = useState(300000);
  const [currentRate, setCurrentRate] = useState(6.5);
  const [currentPayment, setCurrentPayment] = useState(2000);
  const [yearsRemaining, setYearsRemaining] = useState(25);

  // Refinance scenario
  const [newRate, setNewRate] = useState(5.5);
  const [newTerm, setNewTerm] = useState(30);
  const [closingCosts, setClosingCosts] = useState(5000);
  const [cashOut, setCashOut] = useState(0);

  function handleReset() {
    setCurrentBalance(300000);
    setCurrentRate(6.5);
    setCurrentPayment(2000);
    setYearsRemaining(25);
    setNewRate(5.5);
    setNewTerm(30);
    setClosingCosts(5000);
    setCashOut(0);
  }

  const results = useMemo(() => {
    const newLoanAmount = currentBalance + cashOut;
    const newMonthlyPayment = calcMonthlyPayment(newLoanAmount, newRate, newTerm);
    const monthlySavings = currentPayment - newMonthlyPayment;

    // Break-even: months until cumulative savings cover closing costs
    const breakEvenMonths =
      monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : -1;

    // Total interest on current path
    const currentTotalInterest = currentPayment * yearsRemaining * 12 - currentBalance;

    // Total interest on refinance path
    const refinanceTotalInterest = calcTotalInterest(newLoanAmount, newMonthlyPayment, newTerm);

    // Interest saved
    const interestSaved = currentTotalInterest - refinanceTotalInterest;

    // Net savings after closing costs
    const netSavings = interestSaved - closingCosts;

    // Decision logic
    let decision: "yes" | "maybe" | "no";
    if (monthlySavings <= 0) {
      decision = "no";
    } else if (breakEvenMonths <= 24 && netSavings > 10000) {
      decision = "yes";
    } else if (breakEvenMonths <= 36 || (netSavings >= 5000 && netSavings <= 10000)) {
      decision = "maybe";
    } else {
      decision = "no";
    }

    // Chart data: cumulative savings vs closing costs over time
    const chartMonths = breakEvenMonths > 0 ? breakEvenMonths + 24 : 60;
    const chartData: Array<{
      month: number;
      closingCosts: number;
      cumulativeSavings: number;
    }> = [];
    for (let m = 0; m <= chartMonths; m++) {
      chartData.push({
        month: m,
        closingCosts: closingCosts,
        cumulativeSavings: Math.round(Math.max(0, monthlySavings * m)),
      });
    }

    // Find break-even data point for marker
    const breakEvenDataPoint =
      breakEvenMonths > 0 && breakEvenMonths < chartData.length
        ? chartData[breakEvenMonths]
        : null;

    return {
      newLoanAmount,
      newMonthlyPayment: Math.round(newMonthlyPayment),
      monthlySavings: Math.round(monthlySavings),
      breakEvenMonths,
      currentTotalInterest: Math.round(currentTotalInterest),
      refinanceTotalInterest: Math.round(refinanceTotalInterest),
      interestSaved: Math.round(interestSaved),
      netSavings: Math.round(netSavings),
      decision,
      chartData,
      breakEvenDataPoint,
    };
  }, [currentBalance, currentPayment, yearsRemaining, newRate, newTerm, closingCosts, cashOut]);

  const decisionConfig = {
    yes: {
      label: "Yes, Refinance!",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/30",
      desc: "Strong savings potential. You'll break even quickly and save significantly over the life of the loan.",
      icon: (
        <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    maybe: {
      label: "Worth Considering",
      color: "text-gold-dark",
      bg: "bg-gold/10",
      border: "border-gold/30",
      desc: "Moderate savings potential. Consider how long you plan to stay in your home and whether the savings justify the effort.",
      icon: (
        <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    no: {
      label: "Probably Not Worth It",
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20",
      desc: results.monthlySavings <= 0
        ? "The new payment would be higher than your current payment. Refinancing wouldn't save you money."
        : "The break-even period is too long and net savings are too small to justify the closing costs.",
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const dc = decisionConfig[results.decision];

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-lg text-dark-text font-semibold text-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all";

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Mortgage Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary mb-6">Current Mortgage</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Current Loan Balance ($)
              </label>
              <input
                type="number"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(Number(e.target.value) || 0)}
                className={inputClass}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Current Interest Rate (%)
                <InfoTooltip text="Your current mortgage APR. Check your latest mortgage statement or online account for this number." />
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={currentRate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setCurrentRate(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className={inputClass + " pr-10"}
                  min={0}
                  step={0.1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg pointer-events-none">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Current Monthly Payment ($)
                <InfoTooltip text="Your current principal & interest payment. Exclude taxes, insurance, and HOA if they are escrowed separately." />
              </label>
              <input
                type="number"
                value={currentPayment}
                onChange={(e) => setCurrentPayment(Number(e.target.value) || 0)}
                className={inputClass}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Years Remaining
              </label>
              <input
                type="number"
                value={yearsRemaining}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setYearsRemaining(Math.min(30, Math.max(1, v)));
                }}
                className={inputClass}
                min={1}
                max={30}
              />
            </div>
          </div>
        </div>

        {/* Refinance Scenario Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary mb-6">Refinance Scenario</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                New Interest Rate (%)
                <InfoTooltip text="The rate offered by your lender for refinancing. Shop multiple lenders to find the best rate." />
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setNewRate(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className={inputClass + " pr-10"}
                  min={0}
                  step={0.1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg pointer-events-none">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                New Loan Term (years)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TERM_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewTerm(t)}
                    className={`py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                      newTerm === t
                        ? "bg-gold text-primary shadow-md"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {t} yr
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Closing Costs ($)
                <InfoTooltip text="Fees charged to process the refinance — typically 2-5% of the loan amount. Includes appraisal, title insurance, origination fees, and more." />
              </label>
              <input
                type="number"
                value={closingCosts}
                onChange={(e) => setClosingCosts(Number(e.target.value) || 0)}
                className={inputClass}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Cash Out Amount ($)
                <InfoTooltip text="Optional extra cash you want to take out of your home equity. This increases your new loan balance." />
              </label>
              <input
                type="number"
                value={cashOut}
                onChange={(e) => setCashOut(Number(e.target.value) || 0)}
                className={inputClass}
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
        >
          Reset Defaults
        </button>
      </div>

      {/* Decision Card */}
      <div className={`rounded-2xl shadow-xl border-2 ${dc.border} ${dc.bg} p-6 sm:p-8`}>
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0 mt-1">{dc.icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Should You Refinance?
            </p>
            <p className={`text-2xl sm:text-3xl font-extrabold ${dc.color} mb-2`}>
              {dc.label}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              {dc.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-5 sm:p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            New Monthly Payment
          </p>
          <p className="text-2xl font-extrabold text-dark-text">
            {formatFullCurrency(results.newMonthlyPayment)}
          </p>
          <p className={`text-sm font-semibold mt-1 ${results.monthlySavings > 0 ? "text-accent" : results.monthlySavings < 0 ? "text-red-500" : "text-gray-400"}`}>
            {results.monthlySavings > 0
              ? `Save ${formatFullCurrency(results.monthlySavings)}/mo`
              : results.monthlySavings < 0
                ? `${formatFullCurrency(Math.abs(results.monthlySavings))}/mo more`
                : "No change"}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-5 sm:p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Break-Even Point
            <InfoTooltip text="The number of months it takes for your monthly savings to recoup the closing costs. You need to stay in your home at least this long to benefit." />
          </p>
          <p className="text-2xl font-extrabold text-dark-text">
            {results.breakEvenMonths > 0
              ? `${results.breakEvenMonths} months`
              : "N/A"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {results.breakEvenMonths > 0
              ? `${(results.breakEvenMonths / 12).toFixed(1)} years`
              : "Savings don't cover costs"}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-5 sm:p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Total Interest Saved
          </p>
          <p className={`text-2xl font-extrabold ${results.interestSaved > 0 ? "text-accent" : "text-dark-text"}`}>
            {formatFullCurrency(results.interestSaved)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Over life of loan
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-5 sm:p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Net Savings
          </p>
          <p className={`text-2xl font-extrabold ${results.netSavings > 0 ? "text-gold-dark" : "text-dark-text"}`}>
            {formatFullCurrency(results.netSavings)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            After closing costs
          </p>
        </div>
      </div>

      {/* Break-Even Timeline Chart */}
      {results.monthlySavings > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary mb-1">
            Break-Even Timeline
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            When your cumulative monthly savings surpass the closing costs
          </p>
          <div className="h-[350px] sm:h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={results.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  label={{ value: "Months", position: "insideBottom", offset: -2, fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="closingCosts"
                  name="Closing Costs"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeSavings"
                  name="Cumulative Savings"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                />
                {results.breakEvenDataPoint && (
                  <>
                    <ReferenceLine
                      x={results.breakEvenDataPoint.month}
                      stroke="#D4AF37"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                    />
                    <ReferenceDot
                      x={results.breakEvenDataPoint.month}
                      y={results.breakEvenDataPoint.cumulativeSavings}
                      r={8}
                      fill="#D4AF37"
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-accent inline-block rounded" />
              <span className="text-gray-500">Cumulative Savings</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-0.5 inline-block rounded"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #EF4444 0, #EF4444 4px, transparent 4px, transparent 8px)",
                }}
              />
              <span className="text-gray-500">Closing Costs</span>
            </div>
            {results.breakEvenDataPoint && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gold rounded-full inline-block border-2 border-white shadow" />
                <span className="text-gray-500">Break-Even Point</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-6">
          Side-by-Side Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 pr-4 font-bold text-gray-400 uppercase tracking-wider text-xs"></th>
                <th className="text-right py-3 px-4 font-bold text-primary uppercase tracking-wider text-xs">
                  Current
                </th>
                <th className="text-right py-3 pl-4 font-bold text-accent uppercase tracking-wider text-xs">
                  Refinance
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-4 pr-4 font-semibold text-dark-text">Interest Rate</td>
                <td className="py-4 px-4 text-right text-gray-600">{currentRate}%</td>
                <td className="py-4 pl-4 text-right font-semibold text-accent">{newRate}%</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-4 pr-4 font-semibold text-dark-text">Monthly Payment</td>
                <td className="py-4 px-4 text-right text-gray-600">{formatFullCurrency(currentPayment)}</td>
                <td className="py-4 pl-4 text-right font-semibold text-accent">{formatFullCurrency(results.newMonthlyPayment)}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-4 pr-4 font-semibold text-dark-text">Remaining Term</td>
                <td className="py-4 px-4 text-right text-gray-600">{yearsRemaining} years</td>
                <td className="py-4 pl-4 text-right font-semibold text-accent">{newTerm} years</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-4 pr-4 font-semibold text-dark-text">
                  Total Interest
                  <InfoTooltip text="Total interest paid over the remaining life of the loan on each path." />
                </td>
                <td className="py-4 px-4 text-right text-gray-600">{formatFullCurrency(results.currentTotalInterest)}</td>
                <td className="py-4 pl-4 text-right font-semibold text-accent">{formatFullCurrency(results.refinanceTotalInterest)}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-4 pr-4 font-semibold text-dark-text">Loan Balance</td>
                <td className="py-4 px-4 text-right text-gray-600">{formatFullCurrency(currentBalance)}</td>
                <td className="py-4 pl-4 text-right font-semibold text-accent">{formatFullCurrency(results.newLoanAmount)}</td>
              </tr>
              {closingCosts > 0 && (
                <tr>
                  <td className="py-4 pr-4 font-semibold text-dark-text">Closing Costs</td>
                  <td className="py-4 px-4 text-right text-gray-600">-</td>
                  <td className="py-4 pl-4 text-right font-semibold text-red-500">{formatFullCurrency(closingCosts)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions */}
      <div className="bg-light-bg rounded-xl p-6 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 mb-3">Assumptions & Notes</h3>
        <ul className="space-y-1.5 text-xs text-gray-400 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-gray-300 flex-shrink-0">-</span>
            Assumes you stay in your home past the break-even point.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 flex-shrink-0">-</span>
            Does not include potential tax implications of mortgage interest deduction changes.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 flex-shrink-0">-</span>
            Closing costs are estimates — actual costs may vary by lender and location.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 flex-shrink-0">-</span>
            Does not account for property taxes, homeowner&apos;s insurance, or PMI.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 flex-shrink-0">-</span>
            For educational purposes only. This is not financial advice — consult a qualified mortgage professional.
          </li>
        </ul>
      </div>
    </div>
  );
}
