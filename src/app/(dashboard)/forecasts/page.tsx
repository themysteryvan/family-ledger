"use client";

import { LineChart } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { buildFinancialSummary, fmt } from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";

function buildForecast(totalAssets: number, totalDebt: number, monthlyCashFlow: number, months: number) {
  const data = [];
  const monthlyReturn = 0.07 / 12;
  let assets = totalAssets;
  let debt = totalDebt;
  const now = new Date();
  for (let i = 0; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    data.push({
      date: d.toISOString().slice(0, 7),
      assets: Math.round(assets),
      debt: Math.round(debt),
      netWorth: Math.round(assets - debt),
    });
    assets = assets * (1 + monthlyReturn) + monthlyCashFlow;
    debt = Math.max(0, debt - 3200);
  }
  return data;
}

export default function ForecastsPage() {
  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);
  const assets = useFinanceStore((s) => s.assets);
  const debts = useFinanceStore((s) => s.debts);

  const summary = buildFinancialSummary(incomes, expenses, assets, debts);
  const forecast12 = buildForecast(summary.totalAssets, summary.totalDebt, summary.monthlyCashFlow, 12);
  const forecast60 = buildForecast(summary.totalAssets, summary.totalDebt, summary.monthlyCashFlow, 60);
  const projectedNetWorth1yr = forecast12[forecast12.length - 1].netWorth;
  const projectedNetWorth5yr = forecast60[forecast60.length - 1].netWorth;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Forecasts</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Projected financial trajectory based on current trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current Net Worth" value={fmt(summary.netWorth, true)} icon={LineChart} accent="blue" />
        <StatCard title="1-Year Projection" value={fmt(projectedNetWorth1yr, true)} sub={(projectedNetWorth1yr - summary.netWorth >= 0 ? "+" : "") + fmt(projectedNetWorth1yr - summary.netWorth, true)} accent="green" trend="up" />
        <StatCard title="5-Year Projection" value={fmt(projectedNetWorth5yr, true)} sub={(projectedNetWorth5yr - summary.netWorth >= 0 ? "+" : "") + fmt(projectedNetWorth5yr - summary.netWorth, true)} accent="purple" trend="up" />
        <StatCard title="Monthly Savings" value={fmt(summary.monthlyCashFlow)} sub="Fueling growth" accent="amber" />
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>12-Month Forecast</CardTitle>
        <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Assumes 7% annual investment return and current cash flow</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={forecast12} margin={{ top: 8 }}>
            <defs>
              <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="nwGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} formatter={(v) => [fmt(Number(v)), ""]} />
            <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
            <Area type="monotone" dataKey="assets" name="Assets" stroke="#10b981" strokeWidth={2} fill="url(#assetGrad)" />
            <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3b82f6" strokeWidth={2} fill="url(#nwGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>5-Year Forecast</CardTitle>
        <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Long-range projection — assumes consistent savings and debt payoff</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={forecast60} margin={{ top: 8 }}>
            <defs>
              <linearGradient id="longNW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 7)} interval={11} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={56} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} formatter={(v) => [fmt(Number(v)), "Net Worth"]} />
            <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#a78bfa" strokeWidth={2} fill="url(#longNW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
