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
} from "recharts";

type CompoundFrequency = "daily" | "monthly" | "quarterly" | "annually";

const FREQUENCY_OPTIONS: { value: CompoundFrequency; label: string; n: number }[] = [
  { value: "daily", label: "Daily", n: 365 },
  { value: "monthly", label: "Monthly", n: 12 },
  { value: "quarterly", label: "Quarterly", n: 4 },
  { value: "annually", label: "Annually", n: 1 },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
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
        className="w-4 h-4 text-gray-600 hover:text-primary transition-colors"
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
  label?: string;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[200px]">
      <p className="text-sm font-semibold text-primary mb-2">Year {label}</p>
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

interface Scenario {
  id: number;
  label: string;
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  frequency: CompoundFrequency;
}

interface YearRow {
  year: number;
  principal: number;
  interest: number;
  total: number;
}

function calculate(
  principal: number,
  monthly: number,
  rate: number,
  years: number,
  frequency: CompoundFrequency
) {
  const n = FREQUENCY_OPTIONS.find((f) => f.value === frequency)!.n;
  const r = rate / 100;

  const chartData: Array<{ year: number; contributions: number; interest: number }> = [];
  const yearRows: YearRow[] = [];

  for (let y = 0; y <= years; y++) {
    const t = y;
    let futureValue: number;
    const totalContributions = principal + monthly * 12 * t;

    if (r === 0) {
      futureValue = totalContributions;
    } else {
      // A = P(1 + r/n)^(nt)
      const compoundFactor = Math.pow(1 + r / n, n * t);
      const principalGrowth = principal * compoundFactor;

      // FV of annuity: PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
      // monthly contribution -> per-period contribution
      const periodsPerYear = n;
      const ratePerPeriod = r / n;
      const totalPeriods = n * t;
      const monthlyToPerPeriod = monthly * (12 / periodsPerYear);
      const annuityGrowth =
        totalPeriods > 0
          ? monthlyToPerPeriod * ((compoundFactor - 1) / ratePerPeriod)
          : 0;

      futureValue = principalGrowth + annuityGrowth;
    }

    const interestEarned = futureValue - totalContributions;

    chartData.push({
      year: y,
      contributions: Math.round(totalContributions),
      interest: Math.round(Math.max(0, interestEarned)),
    });

    if (y > 0) {
      yearRows.push({
        year: y,
        principal: Math.round(totalContributions),
        interest: Math.round(Math.max(0, interestEarned)),
        total: Math.round(futureValue),
      });
    }
  }

  const finalData = chartData[chartData.length - 1];
  return {
    futureValue: finalData.contributions + finalData.interest,
    totalContributions: finalData.contributions,
    totalInterest: finalData.interest,
    chartData,
    yearRows,
  };
}

export default function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(5000);
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(30);
  const [frequency, setFrequency] = useState<CompoundFrequency>("monthly");
  const [tableOpen, setTableOpen] = useState(false);

  // Compare scenarios
  const [comparing, setComparing] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [nextId, setNextId] = useState(1);

  function handleReset() {
    setPrincipal(5000);
    setMonthly(200);
    setRate(7);
    setYears(30);
    setFrequency("monthly");
    setComparing(false);
    setScenarios([]);
  }

  const result = useMemo(
    () => calculate(principal, monthly, rate, years, frequency),
    [principal, monthly, rate, years, frequency]
  );

  const scenarioResults = useMemo(
    () =>
      scenarios.map((s) => ({
        ...s,
        result: calculate(s.principal, s.monthly, s.rate, s.years, s.frequency),
      })),
    [scenarios]
  );

  function addScenario() {
    setComparing(true);
    setScenarios((prev) => [
      ...prev,
      {
        id: nextId,
        label: `Scenario ${prev.length + 2}`,
        principal,
        monthly,
        rate,
        years,
        frequency,
      },
    ]);
    setNextId((n) => n + 1);
  }

  function removeScenario(id: number) {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) setComparing(false);
      return next;
    });
  }

  // Build comparison chart data — merge all scenarios by year
  const comparisonChartData = useMemo(() => {
    if (!comparing || scenarios.length === 0) return null;
    const maxYear = Math.max(years, ...scenarios.map((s) => s.years));
    const rows: Array<Record<string, number>> = [];
    for (let y = 0; y <= maxYear; y++) {
      const row: Record<string, number> = { year: y };
      // Current scenario
      if (y <= years) {
        const curr = calculate(principal, monthly, rate, y, frequency);
        row["Current"] = curr.futureValue;
      }
      // Other scenarios
      for (const s of scenarios) {
        if (y <= s.years) {
          const sr = calculate(s.principal, s.monthly, s.rate, y, s.frequency);
          row[s.label] = sr.futureValue;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [comparing, scenarios, principal, monthly, rate, years, frequency]);

  const SCENARIO_COLORS = ["#10B981", "#D4AF37", "#6366F1", "#EF4444"];

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-lg text-dark-text font-semibold text-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-all";

  return (
    <div className="space-y-8">
      {/* Inputs Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-6">Your Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Initial Investment ($)
              <InfoTooltip text="The lump sum you're starting with. This is your beginning principal that will compound over time." />
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Monthly Contribution ($)
              <InfoTooltip text="The amount you add each month. Consistent contributions are the most powerful lever for building wealth." />
            </label>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value) || 0)}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Annual Interest Rate (%)
              <InfoTooltip text="The expected annual rate of return. Historically, the S&P 500 has averaged ~10% before inflation, or ~7% after inflation." />
            </label>
            <div className="relative">
              <input
                type="number"
                value={rate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setRate(isNaN(v) ? 0 : Math.max(0, v));
                }}
                className={inputClass + " pr-10"}
                min={0}
                step={0.1}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold text-lg pointer-events-none">
                %
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Time Period (years)
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setYears(Math.min(50, Math.max(1, v)));
              }}
              className={inputClass}
              min={1}
              max={50}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Compound Frequency
              <InfoTooltip text="How often interest is calculated and added to your balance. More frequent compounding produces slightly higher returns." />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                    frequency === opt.value
                      ? "bg-gold text-primary shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={addScenario}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compare Scenario
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Scenario Comparison Cards */}
      {comparing && scenarios.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-primary mb-4">Compare Scenarios</h2>
          <div className="space-y-4">
            {scenarios.map((s, idx) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-4"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length] }}
                />
                <input
                  value={s.label}
                  onChange={(e) =>
                    setScenarios((prev) =>
                      prev.map((sc) => (sc.id === s.id ? { ...sc, label: e.target.value } : sc))
                    )
                  }
                  className="font-semibold text-sm text-dark-text border-b border-transparent focus:border-gold outline-none bg-transparent w-28"
                />
                <div className="flex flex-wrap gap-2 text-xs flex-1">
                  <label className="flex items-center gap-1">
                    <span className="text-gray-600">Initial:</span>
                    <input
                      type="number"
                      value={s.principal}
                      onChange={(e) =>
                        setScenarios((prev) =>
                          prev.map((sc) =>
                            sc.id === s.id ? { ...sc, principal: Number(e.target.value) || 0 } : sc
                          )
                        )
                      }
                      className="w-20 px-2 py-1 border border-gray-200 rounded font-semibold text-dark-text focus:ring-1 focus:ring-gold outline-none"
                      min={0}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-gray-600">Monthly:</span>
                    <input
                      type="number"
                      value={s.monthly}
                      onChange={(e) =>
                        setScenarios((prev) =>
                          prev.map((sc) =>
                            sc.id === s.id ? { ...sc, monthly: Number(e.target.value) || 0 } : sc
                          )
                        )
                      }
                      className="w-20 px-2 py-1 border border-gray-200 rounded font-semibold text-dark-text focus:ring-1 focus:ring-gold outline-none"
                      min={0}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-gray-600">Rate:</span>
                    <input
                      type="number"
                      value={s.rate}
                      onChange={(e) =>
                        setScenarios((prev) =>
                          prev.map((sc) =>
                            sc.id === s.id
                              ? { ...sc, rate: Math.max(0, parseFloat(e.target.value) || 0) }
                              : sc
                          )
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-200 rounded font-semibold text-dark-text focus:ring-1 focus:ring-gold outline-none"
                      min={0}
                      step={0.1}
                    />
                    <span className="text-gray-600">%</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-gray-600">Years:</span>
                    <input
                      type="number"
                      value={s.years}
                      onChange={(e) =>
                        setScenarios((prev) =>
                          prev.map((sc) =>
                            sc.id === s.id
                              ? { ...sc, years: Math.min(50, Math.max(1, Number(e.target.value) || 1)) }
                              : sc
                          )
                        )
                      }
                      className="w-16 px-2 py-1 border border-gray-200 rounded font-semibold text-dark-text focus:ring-1 focus:ring-gold outline-none"
                      min={1}
                      max={50}
                    />
                  </label>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-accent">
                    {formatFullCurrency(
                      scenarioResults.find((sr) => sr.id === s.id)?.result.futureValue ?? 0
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeScenario(s.id)}
                  className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label="Remove scenario"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Result Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-2">
              Future Value
              <InfoTooltip text="The total value of your investment at the end of the time period, including all contributions and compound interest earned." />
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-gold">
              {formatFullCurrency(result.futureValue)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-2">
              Total Contributions
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-primary">
              {formatFullCurrency(result.totalContributions)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-2">
              Interest Earned
              <InfoTooltip text="This is the power of compound interest — money your money earned for you, without any additional effort." />
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-accent">
              {formatFullCurrency(result.totalInterest)}
            </p>
          </div>
        </div>
        {result.totalContributions > 0 && (
          <div className="mt-6">
            <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
              <div
                className="bg-primary transition-all duration-500"
                style={{
                  width: `${(result.totalContributions / result.futureValue) * 100}%`,
                }}
              />
              <div
                className="bg-accent transition-all duration-500"
                style={{
                  width: `${(result.totalInterest / result.futureValue) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />
                Contributions ({((result.totalContributions / result.futureValue) * 100).toFixed(0)}%)
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1" />
                Interest ({((result.totalInterest / result.futureValue) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart — Stacked Area or Comparison Lines */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-1">
          {comparing && comparisonChartData ? "Scenario Comparison" : "Growth Over Time"}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {comparing && comparisonChartData
            ? "Total portfolio value for each scenario over time"
            : "How your contributions and compound interest build over time"}
        </p>
        <div className="h-[350px] sm:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            {comparing && comparisonChartData ? (
              <AreaChart
                data={comparisonChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
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
                  dataKey="Current"
                  stroke={SCENARIO_COLORS[0]}
                  fill={SCENARIO_COLORS[0]}
                  fillOpacity={0.1}
                  strokeWidth={2.5}
                />
                {scenarios.map((s, idx) => (
                  <Area
                    key={s.id}
                    type="monotone"
                    dataKey={s.label}
                    stroke={SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length]}
                    fill={SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2.5}
                  />
                ))}
              </AreaChart>
            ) : (
              <AreaChart
                data={result.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
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
                  dataKey="contributions"
                  name="Contributions"
                  stackId="1"
                  stroke="#1A3C6E"
                  fill="#1A3C6E"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="interest"
                  name="Interest Earned"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
          {comparing && comparisonChartData ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-accent inline-block rounded" />
                <span className="text-gray-700">Current</span>
              </div>
              {scenarios.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className="w-4 h-0.5 inline-block rounded"
                    style={{ backgroundColor: SCENARIO_COLORS[(idx + 1) % SCENARIO_COLORS.length] }}
                  />
                  <span className="text-gray-700">{s.label}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-primary inline-block rounded" />
                <span className="text-gray-700">Contributions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-accent inline-block rounded" />
                <span className="text-gray-700">Interest Earned</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Year-by-Year Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50">
        <button
          onClick={() => setTableOpen(!tableOpen)}
          className="w-full flex items-center justify-between p-6 sm:p-8 text-left"
        >
          <div>
            <h2 className="text-xl font-bold text-primary">
              Year-by-Year Breakdown
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed view of your investment growth each year
            </p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 flex-shrink-0 ${
              tableOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {tableOpen && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 pr-4 font-bold text-primary">Year</th>
                    <th className="text-right py-3 px-4 font-bold text-primary">Total Contributions</th>
                    <th className="text-right py-3 px-4 font-bold text-accent">Interest Earned</th>
                    <th className="text-right py-3 pl-4 font-bold text-gold-dark">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearRows.map((row) => (
                    <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-dark-text">{row.year}</td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatFullCurrency(row.principal)}
                      </td>
                      <td className="py-3 px-4 text-right text-accent font-medium">
                        {formatFullCurrency(row.interest)}
                      </td>
                      <td className="py-3 pl-4 text-right font-bold text-dark-text">
                        {formatFullCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
