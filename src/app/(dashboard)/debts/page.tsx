"use client";

import { CreditCard, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { totalDebt, fmt, fmtPct } from "@/lib/finance";
import { mockDebts } from "@/lib/mock-data";

const total = totalDebt(mockDebts);
const totalMinPayments = mockDebts.reduce((s, d) => s + d.minimumPayment, 0);
const avgRate =
  mockDebts.reduce((s, d) => s + d.interestRate * d.balance, 0) / total;

const categoryColors: Record<string, string> = {
  mortgage: "var(--accent-blue)",
  auto: "var(--accent-purple)",
  student: "var(--accent-amber)",
  credit_card: "var(--accent-red)",
  personal: "var(--accent-green)",
  medical: "var(--accent-amber)",
  other: "var(--text-muted)",
};

const categoryLabels: Record<string, string> = {
  mortgage: "Mortgage",
  auto: "Auto Loan",
  student: "Student Loan",
  credit_card: "Credit Card",
  personal: "Personal",
  medical: "Medical",
  other: "Other",
};

export default function DebtsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Debts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Liabilities and debt payoff tracking
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Plus size={15} /> Add Debt
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Debt"
          value={fmt(total, true)}
          icon={CreditCard}
          accent="red"
        />
        <StatCard
          title="Min. Payments"
          value={fmt(totalMinPayments)}
          sub="per month"
          accent="amber"
        />
        <StatCard
          title="Avg. Interest Rate"
          value={fmtPct(avgRate)}
          sub="Weighted by balance"
          accent="purple"
        />
        <StatCard
          title="Debts"
          value={String(mockDebts.length)}
          sub="Active accounts"
          accent="blue"
        />
      </div>

      {/* Debt Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockDebts.map((debt) => {
          const paidPct = ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100;
          return (
            <div
              key={debt.id}
              className="rounded-xl border p-5"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {debt.name}
                  </p>
                  {debt.lender && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {debt.lender}
                    </p>
                  )}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--bg-elevated)",
                    color: categoryColors[debt.category],
                  }}
                >
                  {categoryLabels[debt.category]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Balance
                  </p>
                  <p
                    className="text-base font-semibold mt-0.5"
                    style={{ color: "var(--accent-red)" }}
                  >
                    {fmt(debt.balance)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Rate
                  </p>
                  <p
                    className="text-base font-semibold mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fmtPct(debt.interestRate)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Min. Payment
                  </p>
                  <p
                    className="text-base font-semibold mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fmt(debt.minimumPayment)}/mo
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-muted)" }}>
                    {fmtPct(paidPct, 0)} paid off
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    Original: {fmt(debt.originalBalance)}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${paidPct}%`,
                      background: categoryColors[debt.category],
                    }}
                  />
                </div>
              </div>

              {debt.notes && (
                <p
                  className="text-xs mt-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  {debt.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
