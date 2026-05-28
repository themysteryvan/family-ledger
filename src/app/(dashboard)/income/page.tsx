"use client";

import { TrendingUp, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { monthlyIncome, toMonthly, fmt, fmtPct } from "@/lib/finance";
import { mockIncomes } from "@/lib/mock-data";

const totalMonthly = monthlyIncome(mockIncomes);
const totalAnnual = totalMonthly * 12;

const ownerTotals = mockIncomes.reduce(
  (acc, inc) => {
    if (!inc.isActive) return acc;
    const monthly = toMonthly(inc.amount, inc.frequency);
    acc[inc.owner] = (acc[inc.owner] || 0) + monthly;
    return acc;
  },
  {} as Record<string, number>
);

const ownerChartData = Object.entries(ownerTotals).map(([owner, monthly]) => ({
  owner,
  monthly: Math.round(monthly),
  annual: Math.round(monthly * 12),
}));

const categoryColors: Record<string, string> = {
  salary: "var(--accent-blue)",
  freelance: "var(--accent-purple)",
  investment: "var(--accent-green)",
  rental: "var(--accent-amber)",
  other: "var(--text-muted)",
};

const categoryLabels: Record<string, string> = {
  salary: "Salary",
  freelance: "Freelance",
  investment: "Investment",
  rental: "Rental",
  other: "Other",
};

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Income
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            All household income sources
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Plus size={15} /> Add Income
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={fmt(totalMonthly)}
          icon={TrendingUp}
          accent="green"
          trend="up"
          trendLabel="Active sources"
        />
        <StatCard
          title="Annual Income"
          value={fmt(totalAnnual)}
          accent="blue"
        />
        <StatCard
          title="Jake"
          value={fmt(ownerTotals["Jake"] || 0)}
          sub="per month"
          accent="purple"
        />
        <StatCard
          title="Sarah"
          value={fmt(ownerTotals["Sarah"] || 0)}
          sub="per month"
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <CardTitle>Monthly by Owner</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ownerChartData} margin={{ top: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="owner"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
                formatter={(v) => [fmt(Number(v)), "Monthly"]}
              />
              <Bar dataKey="monthly" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <CardTitle>Income Sources</CardTitle>
          <div className="mt-3 space-y-2">
            {mockIncomes
              .filter((i) => i.isActive)
              .map((inc) => {
                const monthly = toMonthly(inc.amount, inc.frequency);
                const pct = (monthly / totalMonthly) * 100;
                return (
                  <div key={inc.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: categoryColors[inc.category],
                          }}
                        />
                        <span style={{ color: "var(--text-secondary)" }}>
                          {inc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fmtPct(pct, 0)}
                        </span>
                        <span
                          className="font-medium min-w-[80px] text-right"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {fmt(monthly)}/mo
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-muted)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: categoryColors[inc.category],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>All Income Sources</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Source", "Owner", "Category", "Amount", "Frequency", "Monthly", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {mockIncomes.map((inc, i) => (
              <tr
                key={inc.id}
                style={{
                  borderBottom:
                    i < mockIncomes.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <td
                  className="px-5 py-3 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {inc.name}
                </td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                  {inc.owner}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: "var(--bg-elevated)",
                      color: categoryColors[inc.category],
                    }}
                  >
                    {categoryLabels[inc.category]}
                  </span>
                </td>
                <td
                  className="px-5 py-3 font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {fmt(inc.amount)}
                </td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                  {inc.frequency}
                </td>
                <td
                  className="px-5 py-3 font-semibold"
                  style={{ color: "var(--accent-green)" }}
                >
                  {fmt(toMonthly(inc.amount, inc.frequency))}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: inc.isActive
                        ? "var(--accent-green-dim)"
                        : "var(--bg-muted)",
                      color: inc.isActive
                        ? "var(--accent-green)"
                        : "var(--text-muted)",
                    }}
                  >
                    {inc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
