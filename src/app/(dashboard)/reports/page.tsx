"use client";

import { FileText } from "lucide-react";
import {
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
import { buildFinancialSummary, fmt, fmtPct } from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";
import { format, subMonths } from "date-fns";

export default function ReportsPage() {
  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);
  const assets = useFinanceStore((s) => s.assets);
  const debts = useFinanceStore((s) => s.debts);

  const summary = buildFinancialSummary(incomes, expenses, assets, debts);

  // Build 6-month chart data using current figures for the current month.
  // Historical months show dashes until real transaction history is available.
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const isCurrent = i === 5;
    return {
      month: format(d, "MMM"),
      income: isCurrent ? Math.round(summary.monthlyIncome) : 0,
      expenses: isCurrent ? Math.round(summary.monthlyExpenses) : 0,
      savings: isCurrent ? Math.round(summary.monthlyCashFlow) : 0,
      isCurrent,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Monthly financial summary and trend analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Income" value={fmt(summary.monthlyIncome)} icon={FileText} accent="green" />
        <StatCard title="Monthly Expenses" value={fmt(summary.monthlyExpenses)} accent="red" />
        <StatCard title="Monthly Savings" value={fmt(summary.monthlyCashFlow)} accent="blue" />
        <StatCard title="Savings Rate" value={fmtPct(summary.savingsRate)} accent="purple" trend="up" trendLabel="vs 15% target" />
      </div>

      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Income vs Expenses</CardTitle>
        <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Historical months will populate as data is added</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={48} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} formatter={(v) => [fmt(Number(v)), ""]} />
            <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
            <Bar dataKey="income" name="Income" fill="var(--accent-green)" radius={[3, 3, 0, 0]} opacity={0.85} />
            <Bar dataKey="expenses" name="Expenses" fill="var(--accent-red)" radius={[3, 3, 0, 0]} opacity={0.85} />
            <Bar dataKey="savings" name="Net Savings" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Monthly Summary</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Month", "Income", "Expenses", "Net Savings", "Savings Rate"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row, i) => {
              const rate = row.income > 0 ? (row.savings / row.income) * 100 : 0;
              return (
                <tr key={row.month} style={{ borderBottom: i < monthlyData.length - 1 ? "1px solid var(--border-subtle)" : "none", background: row.isCurrent ? "var(--bg-elevated)" : "transparent" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {row.month}{row.isCurrent ? " (current)" : ""}
                  </td>
                  <td className="px-5 py-3" style={{ color: row.isCurrent ? "var(--accent-green)" : "var(--text-muted)" }}>
                    {row.isCurrent ? fmt(row.income) : "—"}
                  </td>
                  <td className="px-5 py-3" style={{ color: row.isCurrent ? "var(--accent-red)" : "var(--text-muted)" }}>
                    {row.isCurrent ? fmt(row.expenses) : "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold" style={{ color: row.isCurrent ? "var(--accent-blue)" : "var(--text-muted)" }}>
                    {row.isCurrent ? fmt(row.savings) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {row.isCurrent ? (
                      <span style={{ color: rate >= 20 ? "var(--accent-green)" : rate >= 10 ? "var(--accent-amber)" : "var(--accent-red)" }}>
                        {fmtPct(rate)}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
