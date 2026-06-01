"use client";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  Receipt,
  Building2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import {
  buildFinancialSummary,
  buildNetWorthHistory,
  toMonthly,
  fmt,
  fmtPct,
} from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";
import { format } from "date-fns";
import { useState, useEffect } from "react";

const PIE_COLORS: Record<string, string> = {
  housing: "#3b82f6",
  kids: "#a78bfa",
  savings: "#10b981",
  food: "#f59e0b",
  transport: "#6366f1",
  healthcare: "#f87171",
  utilities: "#22d3ee",
  insurance: "#fb923c",
  entertainment: "#e879f9",
  personal: "#94a3b8",
  education: "#34d399",
  debt: "#fbbf24",
  other: "#6b7280",
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { incomes, expenses, assets, debts, retirementAccounts, householdName, isAuthenticatedUser, isLoadedFromSupabase } = useFinanceStore();
  const isEmpty = isAuthenticatedUser && isLoadedFromSupabase &&
    incomes.length === 0 && expenses.length === 0 && assets.length === 0 && debts.length === 0;

  const retirementTotal = retirementAccounts.reduce((s, a) => s + a.balance, 0);
  const summary = buildFinancialSummary(incomes, expenses, assets, debts, retirementTotal);
  const netWorthHistory = mounted ? buildNetWorthHistory(summary.totalAssets, summary.totalDebt) : [];

  const categoryTotals = expenses.reduce((acc, e) => {
    const m = toMonthly(e.amount, e.frequency);
    acc[e.category] = (acc[e.category] || 0) + m;
    return acc;
  }, {} as Record<string, number>);

  const expensePieData = Object.entries(categoryTotals)
    .map(([cat, val]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: Math.round(val),
      color: PIE_COLORS[cat] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  const subtitle = mounted
    ? (isAuthenticatedUser
        ? (householdName ? `${householdName} · ` : "") + format(new Date(), "MMMM yyyy")
        : "Demo · " + format(new Date(), "MMMM yyyy"))
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      </div>

      {isEmpty && (
        <div className="rounded-xl border p-8" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Welcome to Family Ledger</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Add your financial data to get a complete picture of your household finances.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/income", icon: TrendingUp, label: "Add income", desc: "Salaries, freelance, investments" },
              { href: "/expenses", icon: Receipt, label: "Add expenses", desc: "Bills, subscriptions, spending" },
              { href: "/assets", icon: Building2, label: "Add assets", desc: "Home, retirement, savings" },
              { href: "/debts", icon: CreditCard, label: "Add debts", desc: "Mortgage, loans, credit cards" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-3 p-4 rounded-xl border transition-colors hover:border-[var(--accent-blue)]"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-blue-dim)" }}>
                  <Icon size={15} style={{ color: "var(--accent-blue)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                    <Plus size={12} />{label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isEmpty && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Income" value={fmt(summary.monthlyIncome)} sub="All sources combined" icon={TrendingUp} accent="green" trend="up" trendLabel="~$173k annual" />
        <StatCard title="Monthly Expenses" value={fmt(summary.monthlyExpenses)} sub="Fixed + variable" icon={TrendingDown} accent="red" trend="neutral" trendLabel="vs $12,500 budgeted" />
        <StatCard title="Monthly Cash Flow" value={fmt(summary.monthlyCashFlow)} sub="After all expenses" icon={Wallet} accent={summary.monthlyCashFlow >= 0 ? "blue" : "red"} trend={summary.monthlyCashFlow >= 0 ? "up" : "down"} trendLabel={fmtPct(summary.savingsRate) + " savings rate"} />
        <StatCard title="Net Worth" value={fmt(summary.netWorth, true)} sub="Assets minus debts" icon={PiggyBank} accent="purple" trend="up" trendLabel="Growing" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Net Worth Trend</CardTitle>
              <p className="text-xl font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{fmt(summary.netWorth)}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
              <ArrowUpRight size={12} /> +8.4% YTD
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthHistory}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={48} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }}
                formatter={(v) => [fmt(Number(v)), "Net Worth"]}
              />
              <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Expense Breakdown</CardTitle>
          <p className="text-xl font-semibold mt-0.5 mb-4" style={{ color: "var(--text-primary)" }}>{fmt(summary.monthlyExpenses)}/mo</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {expensePieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }}
                formatter={(v) => [fmt(Number(v)), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {expensePieData.slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Balance Sheet Snapshot</CardTitle>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--text-secondary)" }}>Regular Assets</span>
                <span className="font-semibold" style={{ color: "var(--accent-green)" }}>{fmt(summary.totalAssets - retirementTotal)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full" style={{ width: "100%", background: "var(--accent-green)" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--text-secondary)" }}>Retirement Accounts</span>
                <span className="font-semibold" style={{ color: "var(--accent-purple)" }}>{fmt(retirementTotal)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${summary.totalAssets > 0 ? (retirementTotal / summary.totalAssets) * 100 : 0}%`, background: "var(--accent-purple)" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "var(--text-secondary)" }}>Total Debt</span>
                <span className="font-semibold" style={{ color: "var(--accent-red)" }}>{fmt(summary.totalDebt)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${summary.totalAssets > 0 ? (summary.totalDebt / summary.totalAssets) * 100 : 0}%`, background: "var(--accent-red)" }} />
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Net Worth</span>
                <span className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>{fmt(summary.netWorth)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Key Ratios</CardTitle>
          <div className="mt-4 space-y-4">
            {[
              { label: "Savings Rate", value: fmtPct(summary.savingsRate), target: "≥ 20%", ok: summary.savingsRate >= 20, pct: Math.min(summary.savingsRate / 30, 1) },
              { label: "Expense Ratio", value: fmtPct(summary.expenseRatio), target: "≤ 80%", ok: summary.expenseRatio <= 80, pct: Math.min(summary.expenseRatio / 100, 1) },
              { label: "Debt-to-Income", value: fmtPct(summary.debtToIncomeRatio), target: "≤ 36%", ok: summary.debtToIncomeRatio <= 36, pct: Math.min(summary.debtToIncomeRatio / 100, 1) },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.target}</span>
                    <span className="font-semibold" style={{ color: r.ok ? "var(--accent-green)" : "var(--accent-amber)" }}>{r.value}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.pct * 100}%`, background: r.ok ? "var(--accent-green)" : "var(--accent-amber)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Active Debts</CardTitle>
          <CreditCard size={16} style={{ color: "var(--text-muted)" }} />
        </div>
        {debts.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>No debts added yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {debts.map((debt) => (
              <div key={debt.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{debt.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{debt.interestRate}% APR · Min {fmt(debt.minimumPayment)}/mo</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "var(--accent-red)" }}>{fmt(debt.balance)}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>of {fmt(debt.originalBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}
