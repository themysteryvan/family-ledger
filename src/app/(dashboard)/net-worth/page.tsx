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
import { buildFinancialSummary, buildNetWorthHistory, fmt } from "@/lib/finance";
import {
  mockIncomes,
  mockExpenses,
  mockAssets,
  mockDebts,
} from "@/lib/mock-data";

const summary = buildFinancialSummary(
  mockIncomes,
  mockExpenses,
  mockAssets,
  mockDebts
);
const history = buildNetWorthHistory(summary.totalAssets, summary.totalDebt, 12);
const firstNetWorth = history[0].netWorth;
const netWorthChange = summary.netWorth - firstNetWorth;
const netWorthChangePct = (netWorthChange / Math.abs(firstNetWorth)) * 100;

export default function NetWorthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Net Worth
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Assets minus liabilities over time
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Net Worth"
          value={fmt(summary.netWorth)}
          icon={BarChart3}
          accent="blue"
          trend="up"
          trendLabel="12-month growth"
        />
        <StatCard
          title="Total Assets"
          value={fmt(summary.totalAssets, true)}
          accent="green"
        />
        <StatCard
          title="Total Debt"
          value={fmt(summary.totalDebt, true)}
          accent="red"
        />
        <StatCard
          title="12-Month Change"
          value={`+${fmt(netWorthChange, true)}`}
          sub={`+${netWorthChangePct.toFixed(1)}% growth`}
          accent="purple"
          trend="up"
          trendLabel="YTD"
        />
      </div>

      {/* Net Worth Chart */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <CardTitle>Net Worth Over Time</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={history} margin={{ top: 16 }}>
            <defs>
              <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 12,
              }}
              formatter={(v) => [fmt(Number(v)), "Net Worth"]}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#nwArea)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Assets vs Debt Stacked */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <CardTitle>Assets vs Debt History</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={history} margin={{ top: 16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                fontSize: 12,
              }}
              formatter={(v) => [fmt(Number(v)), ""]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="totalAssets"
              name="Assets"
              fill="var(--accent-green)"
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
            <Bar
              dataKey="totalDebt"
              name="Debt"
              fill="var(--accent-red)"
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
