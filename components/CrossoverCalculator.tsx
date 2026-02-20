"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

const MAX_YEARS = 50;
const SAFE_WITHDRAWAL_RATE = 0.04;

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthToDate(month: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + month, 1);
  return target.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

interface DataPoint {
  month: number;
  label: string;
  portfolio: number;
  passiveIncome: number;
  expenses: number;
}

interface InfoTooltipProps {
  text: string;
}

function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="relative group inline-flex ml-1.5 cursor-help">
      <svg
        className="w-4 h-4 text-gray-700 hover:text-primary transition-colors"
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
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px]">
      <p className="text-sm font-semibold text-primary mb-2">{label}</p>
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

export default function CrossoverCalculator() {
  const [currentAssets, setCurrentAssets] = useState(10000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000);

  function handleReset() {
    setCurrentAssets(10000);
    setMonthlyInvestment(500);
    setAnnualReturn(7);
    setMonthlyExpenses(3000);
  }

  const { data, crossoverMonth, crossoverPortfolio, milestones } = useMemo(() => {
    const monthlyRate = annualReturn / 100 / 12;
    const maxMonths = MAX_YEARS * 12;
    const points: DataPoint[] = [];
    let balance = currentAssets;
    let crossMonth = -1;
    let crossPortfolio = 0;
    const milestoneTargets = [0.25, 0.5, 0.75, 1.0];
    const milestoneResults: Array<{
      pct: number;
      month: number;
      portfolio: number;
      passiveIncome: number;
      reached: boolean;
    }> = milestoneTargets.map((pct) => ({
      pct,
      month: -1,
      portfolio: 0,
      passiveIncome: 0,
      reached: false,
    }));

    // sample interval: show fewer points for readability
    const sampleInterval = maxMonths > 120 ? 6 : maxMonths > 60 ? 3 : 1;

    for (let m = 0; m <= maxMonths; m++) {
      if (m > 0) {
        balance = balance * (1 + monthlyRate) + monthlyInvestment;
      }
      const passiveIncome = (balance * SAFE_WITHDRAWAL_RATE) / 12;

      // Check crossover
      if (crossMonth === -1 && passiveIncome >= monthlyExpenses) {
        crossMonth = m;
        crossPortfolio = balance;
      }

      // Check milestones
      for (const ms of milestoneResults) {
        if (!ms.reached && passiveIncome >= monthlyExpenses * ms.pct) {
          ms.month = m;
          ms.portfolio = balance;
          ms.passiveIncome = passiveIncome;
          ms.reached = true;
        }
      }

      // Stop collecting data a bit after crossover for chart niceness
      const shouldStop = crossMonth !== -1 && m > crossMonth * 1.3 + 12;
      if (shouldStop && m % sampleInterval === 0) {
        // add final point and break
        const yearLabel =
          m < 12
            ? `${m}mo`
            : m % 12 === 0
              ? `Yr ${m / 12}`
              : `Yr ${(m / 12).toFixed(1)}`;
        points.push({
          month: m,
          label: yearLabel,
          portfolio: Math.round(balance),
          passiveIncome: Math.round(passiveIncome),
          expenses: monthlyExpenses,
        });
        break;
      }

      if (m % sampleInterval === 0) {
        const yearLabel =
          m < 12
            ? `${m}mo`
            : m % 12 === 0
              ? `Yr ${m / 12}`
              : `Yr ${(m / 12).toFixed(1)}`;
        points.push({
          month: m,
          label: yearLabel,
          portfolio: Math.round(balance),
          passiveIncome: Math.round(passiveIncome),
          expenses: monthlyExpenses,
        });
      }
    }

    return {
      data: points,
      crossoverMonth: crossMonth,
      crossoverPortfolio: crossPortfolio,
      milestones: milestoneResults,
    };
  }, [currentAssets, monthlyInvestment, annualReturn, monthlyExpenses]);

  const crossoverReached = crossoverMonth >= 0;
  const crossoverYears = crossoverReached ? (crossoverMonth / 12).toFixed(1) : null;
  const crossoverDate = crossoverReached ? monthToDate(crossoverMonth) : null;

  // Find crossover point in chart data for the marker
  const crossoverDataPoint = crossoverReached
    ? data.find((d) => d.month >= crossoverMonth)
    : null;

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-lg text-dark-text font-semibold text-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all";

  return (
    <div className="space-y-8">
      {/* Inputs Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-6">Your Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Invested Assets ($)
            </label>
            <input
              type="number"
              value={currentAssets}
              onChange={(e) => setCurrentAssets(Number(e.target.value) || 0)}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly Investment ($)
            </label>
            <input
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value) || 0)}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expected Annual Return (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={annualReturn}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAnnualReturn(isNaN(v) ? 0 : Math.max(0, v));
                }}
                className={inputClass + " pr-10"}
                min={0}
                step={0.1}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-lg pointer-events-none">
                %
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly Expenses ($)
            </label>
            <input
              type="number"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
              className={inputClass}
              min={1}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleReset}
            className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Hero Result Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8 text-center">
        {crossoverReached ? (
          <>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
              Your Crossover Point
              <InfoTooltip text="The Crossover Point is when your passive investment income covers all your monthly expenses — you've reached financial independence." />
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-gold mb-2">
              {crossoverDate}
            </p>
            <p className="text-lg text-gray-700 mb-6">
              <span className="font-bold text-primary">{crossoverYears} years</span>{" "}
              until financial independence
            </p>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-bold px-5 py-2 rounded-full text-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Portfolio at crossover: {formatFullCurrency(crossoverPortfolio)}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
              Your Crossover Point
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-700 mb-2">
              50+ years away
            </p>
            <p className="text-sm text-gray-700 max-w-md mx-auto">
              At current inputs, financial independence is beyond the 50-year
              projection horizon. Try increasing your monthly investment or
              reducing expenses.
            </p>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-1">
          Projection Chart
        </h2>
        <p className="text-sm text-gray-700 mb-6">
          Portfolio growth vs. passive income using the{" "}
          <span className="font-semibold text-dark-text">
            4% Rule
            <InfoTooltip text="The 4% Rule suggests you can safely withdraw 4% of your portfolio each year in retirement. Your monthly passive income is calculated as (Portfolio x 4%) / 12." />
          </span>
        </p>
        <div className="h-[350px] sm:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="portfolio"
                orientation="left"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <YAxis
                yAxisId="income"
                orientation="right"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                yAxisId="portfolio"
                type="monotone"
                dataKey="portfolio"
                name="Portfolio"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#10B981" }}
              />
              <Line
                yAxisId="income"
                type="monotone"
                dataKey="passiveIncome"
                name="Passive Income"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#D4AF37" }}
              />
              <Line
                yAxisId="income"
                type="monotone"
                dataKey="expenses"
                name="Monthly Expenses"
                stroke="#1A3C6E"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 5, fill: "#1A3C6E" }}
              />
              {crossoverDataPoint && (
                <>
                  <ReferenceLine
                    yAxisId="income"
                    x={crossoverDataPoint.label}
                    stroke="#D4AF37"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <ReferenceDot
                    yAxisId="income"
                    x={crossoverDataPoint.label}
                    y={crossoverDataPoint.passiveIncome}
                    r={8}
                    fill="#D4AF37"
                    stroke="#fff"
                    strokeWidth={3}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-accent inline-block rounded" />
            <span className="text-gray-700">Portfolio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-gold inline-block rounded" />
            <span className="text-gray-700">Passive Income</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-0.5 inline-block rounded"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #1A3C6E 0, #1A3C6E 4px, transparent 4px, transparent 8px)",
              }}
            />
            <span className="text-gray-700">Monthly Expenses</span>
          </div>
          {crossoverReached && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gold rounded-full inline-block border-2 border-white shadow-lg" />
              <span className="text-gray-700">Crossover Point</span>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-6">
          Milestones to Financial Independence
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((ms) => {
            const pctLabel = `${Math.round(ms.pct * 100)}%`;
            const reached = ms.reached;
            return (
              <div
                key={ms.pct}
                className={`rounded-xl border-2 p-5 transition-all ${
                  reached
                    ? ms.pct === 1
                      ? "border-gold bg-gold/5"
                      : "border-accent/30 bg-accent/5"
                    : "border-gray-100 bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-2xl font-extrabold ${
                      reached
                        ? ms.pct === 1
                          ? "text-gold"
                          : "text-accent"
                        : "text-gray-700"
                    }`}
                  >
                    {pctLabel}
                  </span>
                  {reached && (
                    <svg
                      className={`w-5 h-5 ${ms.pct === 1 ? "text-gold" : "text-accent"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {reached ? (
                  <>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold text-dark-text">
                        {ms.month < 12
                          ? `${ms.month} months`
                          : `${(ms.month / 12).toFixed(1)} years`}
                      </span>
                    </p>
                    <p className="text-xs text-gray-700">
                      Portfolio: {formatFullCurrency(ms.portfolio)}
                    </p>
                    <p className="text-xs text-gray-700">
                      Income: {formatFullCurrency(ms.passiveIncome)}/mo
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-700">Not reached in 50 years</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
