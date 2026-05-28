"use client";

import { Target } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { monthlyIncome, monthlyExpenses, toMonthly, fmt, fmtPct } from "@/lib/finance";
import { mockIncomes, mockExpenses } from "@/lib/mock-data";

const income = monthlyIncome(mockIncomes);
const actual = monthlyExpenses(mockExpenses);

const budgetCategories = [
  { name: "Housing",       budgeted: 3_700, actual: 3_600 },
  { name: "Kids & Edu",    budgeted: 2_200, actual: 2_110 },
  { name: "Savings",       budgeted: 1_800, actual: 1_733 },
  { name: "Food & Dining", budgeted: 1_500, actual: 1_400 },
  { name: "Transport",     budgeted: 1_050, actual: 975  },
  { name: "Healthcare",    budgeted:   800, actual: 825  },
  { name: "Utilities",     budgeted:   480, actual: 460  },
  { name: "Entertainment", budgeted:   400, actual: 329  },
  { name: "Insurance",     budgeted:   280, actual: 230  },
  { name: "Personal",      budgeted:   350, actual: 405  },
  { name: "Debt Payments", budgeted:   300, actual: 298  },
];

const totalBudgeted = budgetCategories.reduce((s, c) => s + c.budgeted, 0);

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Budget
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Budgeted vs actual spending · May 2026
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={fmt(income)}
          icon={Target}
          accent="green"
        />
        <StatCard
          title="Total Budgeted"
          value={fmt(totalBudgeted)}
          accent="blue"
        />
        <StatCard
          title="Actual Spending"
          value={fmt(actual)}
          accent={actual > totalBudgeted ? "red" : "green"}
          trend={actual > totalBudgeted ? "down" : "up"}
          trendLabel={
            actual > totalBudgeted
              ? fmt(actual - totalBudgeted) + " over"
              : fmt(totalBudgeted - actual) + " under"
          }
        />
        <StatCard
          title="Remaining"
          value={fmt(income - actual)}
          sub="Unallocated cash flow"
          accent="purple"
        />
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Budget vs Actual by Category</CardTitle>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {budgetCategories.map((cat) => {
            const variance = cat.budgeted - cat.actual;
            const overBudget = variance < 0;
            const pctUsed = Math.min((cat.actual / cat.budgeted) * 100, 120);
            return (
              <div key={cat.name} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: "var(--text-muted)" }}>
                      Budgeted: {fmt(cat.budgeted)}
                    </span>
                    <span
                      className="font-semibold"
                      style={{
                        color: overBudget
                          ? "var(--accent-red)"
                          : "var(--accent-green)",
                      }}
                    >
                      {overBudget ? "+" : "−"}
                      {fmt(Math.abs(variance))} {overBudget ? "over" : "saved"}
                    </span>
                    <span
                      className="font-semibold w-20 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fmt(cat.actual)}
                    </span>
                  </div>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden relative"
                  style={{ background: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pctUsed, 100)}%`,
                      background: overBudget
                        ? "var(--accent-red)"
                        : pctUsed > 85
                          ? "var(--accent-amber)"
                          : "var(--accent-green)",
                    }}
                  />
                  {/* Budget marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{
                      left: "83.33%",
                      background: "var(--text-muted)",
                      opacity: 0.5,
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fmtPct(pctUsed, 0)} of budget used
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
