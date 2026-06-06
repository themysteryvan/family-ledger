"use client";

import { BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { buildFinancialSummary, buildNetWorthHistory, filterByOwner, totalAssets, totalDebt, fmt } from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";
import { useState, useEffect } from "react";

export default function NetWorthPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allIncomes = useFinanceStore((s) => s.incomes);
  const allExpenses = useFinanceStore((s) => s.expenses);
  const allAssets = useFinanceStore((s) => s.assets);
  const allDebts = useFinanceStore((s) => s.debts);
  const retirementAccounts = useFinanceStore((s) => s.retirementAccounts);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);

  const incomes = filterByOwner(allIncomes, ownerFilter);
  const expenses = filterByOwner(allExpenses, ownerFilter);
  const assets = filterByOwner(allAssets, ownerFilter);
  const debts = filterByOwner(allDebts, ownerFilter);

  const retirementTotal = retirementAccounts.reduce((s, a) => s + a.balance, 0);
  const summary = buildFinancialSummary(incomes, expenses, assets, debts, retirementTotal);
  const history = mounted ? buildNetWorthHistory(summary.totalAssets, summary.totalDebt, 12) : [];
  const firstNetWorth = history[0]?.netWorth ?? 0;
  const netWorthChange = summary.netWorth - firstNetWorth;
  const netWorthChangePct = firstNetWorth !== 0 ? (netWorthChange / Math.abs(firstNetWorth)) * 100 : 0;

  const regularAssetsTotal = totalAssets(assets);
  const debtTotal = totalDebt(debts);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Net Worth
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Assets minus liabilities over time
          </p>
        </div>
        <FilterBar />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current Net Worth" value={fmt(summary.netWorth)} icon={BarChart3} accent="blue" trend="up" trendLabel="12-month growth" />
        <StatCard title="Total Assets" value={fmt(summary.totalAssets, true)} sub="Includes retirement" accent="green" />
        <StatCard title="Total Debt" value={fmt(summary.totalDebt, true)} accent="red" />
        <StatCard
          title="12-Month Change"
          value={(netWorthChange >= 0 ? "+" : "") + fmt(netWorthChange, true)}
          sub={(netWorthChangePct >= 0 ? "+" : "") + netWorthChangePct.toFixed(1) + "% growth"}
          accent="purple"
          trend="up"
          trendLabel="YTD"
        />
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Net Worth Over Time</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={history} margin={{ top: 16 }}>
            <defs>
              <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} formatter={(v) => [fmt(Number(v)), "Net Worth"]} />
            <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} fill="url(#nwArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Assets vs Debt History</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={history} margin={{ top: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} formatter={(v) => [fmt(Number(v)), ""]} />
            <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
            <Bar dataKey="totalAssets" name="Assets" fill="var(--accent-green)" radius={[2, 2, 0, 0]} opacity={0.8} />
            <Bar dataKey="totalDebt" name="Debt" fill="var(--accent-red)" radius={[2, 2, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Balance Sheet</CardTitle>
        <div className="mt-4 space-y-3">
          {/* Assets */}
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Assets</p>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--text-secondary)" }}>Regular Assets</span>
            <span className="font-semibold" style={{ color: "var(--accent-green)" }}>{fmt(regularAssetsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--text-secondary)" }}>Retirement Accounts</span>
            <span className="font-semibold" style={{ color: "var(--accent-purple)" }}>{fmt(retirementTotal)}</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>Total Assets</span>
            <span className="font-bold" style={{ color: "var(--accent-green)" }}>{fmt(summary.totalAssets)}</span>
          </div>

          {/* Liabilities */}
          <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "var(--text-muted)" }}>Liabilities</p>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--text-secondary)" }}>Total Debt</span>
            <span className="font-semibold" style={{ color: "var(--accent-red)" }}>{fmt(debtTotal)}</span>
          </div>

          {/* Net Worth */}
          <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Net Worth</span>
            <span className="text-xl font-bold" style={{ color: "var(--accent-blue)" }}>{fmt(summary.netWorth)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
