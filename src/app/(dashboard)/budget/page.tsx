"use client";

import { Target } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { monthlyIncome, monthlyExpenses, toMonthly, fmt, fmtPct } from "@/lib/finance";
import { useFinanceStore } from "@/store/finance-store";
import { EmptyState } from "@/components/ui/empty-state";

const categoryLabels: Record<string, string> = {
  housing: "Housing", utilities: "Utilities", food: "Food & Dining",
  transport: "Transport", insurance: "Insurance", healthcare: "Healthcare",
  education: "Education / Kids", entertainment: "Entertainment",
  subscriptions: "Subscriptions", clothing: "Clothing", personal: "Personal",
  savings: "Savings", debt: "Debt Payments", other: "Other",
};

export default function BudgetPage() {
  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);

  const income = monthlyIncome(incomes);
  const actual = monthlyExpenses(expenses);

  // Group actual spending by category from real expense data
  const categoryTotals = expenses.reduce((acc, e) => {
    const m = toMonthly(e.amount, e.frequency);
    acc[e.category] = (acc[e.category] || 0) + m;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({ name: categoryLabels[cat] ?? cat, actual: Math.round(amount), pct: income > 0 ? (amount / income) * 100 : 0 }))
    .sort((a, b) => b.actual - a.actual);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Budget</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Spending breakdown by category</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Monthly Income" value={fmt(income)} icon={Target} accent="green" />
        <StatCard title="Total Spending" value={fmt(actual)} accent={actual > income ? "red" : "blue"} />
        <StatCard title="Remaining" value={fmt(income - actual)} sub="Unallocated cash flow" accent={income - actual >= 0 ? "purple" : "red"} />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Spending by Category</CardTitle>
        </div>

        {categories.length === 0 ? (
          <EmptyState icon={Target} title="No expenses yet" description="Add expenses to see your spending breakdown by category." />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {categories.map((cat) => (
              <div key={cat.name} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cat.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{fmtPct(cat.pct, 0)} of income</span>
                    <span className="font-semibold w-20 text-right" style={{ color: "var(--text-primary)" }}>{fmt(cat.actual)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(cat.pct, 100)}%`,
                      background: cat.pct > 30 ? "var(--accent-red)" : cat.pct > 15 ? "var(--accent-amber)" : "var(--accent-green)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
