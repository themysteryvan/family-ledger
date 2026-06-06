"use client";

import { useState } from "react";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DebtForm } from "@/components/forms/debt-form";
import { useFinanceStore } from "@/store/finance-store";
import { totalDebt, fmt, fmtPct } from "@/lib/finance";
import type { Debt } from "@/types";

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

// Distinct palette for chart — one color per debt regardless of category
const CHART_COLORS = [
  "#3b82f6", "#a78bfa", "#10b981", "#f59e0b",
  "#f87171", "#22d3ee", "#fb923c", "#e879f9",
];

interface Projection {
  balances: number[];   // index = month (0 = today)
  payoffMonth: number | null;
  totalInterest: number | null;
}

function computeProjection(balance: number, annualRate: number, payment: number): Projection {
  const rate = annualRate / 100 / 12;
  const balances: number[] = [balance];
  let totalInterest = 0;

  // Payment doesn't cover interest — debt never pays off
  if (payment <= 0 || (rate > 0 && payment <= balance * rate)) {
    const cap = 180;
    for (let m = 1; m <= cap; m++) {
      balance = Math.max(0, balance * (1 + rate) - payment);
      balances.push(balance);
    }
    return { balances, payoffMonth: null, totalInterest: null };
  }

  for (let m = 1; m <= 360; m++) {
    const interest = balance * rate;
    totalInterest += interest;
    balance = balance + interest - payment;
    if (balance <= 0) {
      totalInterest += balance; // balance is negative = overpayment, adjust
      balances.push(0);
      return { balances, payoffMonth: m, totalInterest };
    }
    balances.push(balance);
  }

  // Didn't pay off within 30 years
  return { balances, payoffMonth: null, totalInterest: null };
}

function monthToDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function DebtsPage() {
  const debts = useFinanceStore((s) => s.debts);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Debt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = totalDebt(debts);
  const totalMinPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const avgRate = total > 0
    ? debts.reduce((s, d) => s + d.interestRate * d.balance, 0) / total
    : 0;

  // ── Payoff projections ────────────────────────────────────────────────────

  // Sort longest-paying first so they render at the bottom of the stacked chart
  const projections = debts
    .map((debt, i) => ({
      debt,
      color: CHART_COLORS[i % CHART_COLORS.length],
      ...computeProjection(debt.balance, debt.interestRate, debt.minimumPayment),
    }))
    .sort((a, b) => b.debt.balance - a.debt.balance);

  const displayMonths = debts.length > 0
    ? Math.min(Math.max(...projections.map(p => p.payoffMonth ?? 180), 24), 360)
    : 0;

  const chartData: Record<string, number>[] = Array.from(
    { length: displayMonths + 1 },
    (_, month) => {
      const point: Record<string, number> = { month };
      for (const p of projections) {
        point[p.debt.id] = p.balances[month] ?? 0;
      }
      return point;
    }
  );

  const yearTicks: number[] = [];
  for (let y = 0; y * 12 <= displayMonths; y++) yearTicks.push(y * 12);

  const totalInterestAll = projections.every(p => p.totalInterest !== null)
    ? projections.reduce((s, p) => s + (p.totalInterest ?? 0), 0)
    : null;

  const lastPayoffMonth = projections.every(p => p.payoffMonth !== null)
    ? Math.max(...projections.map(p => p.payoffMonth!))
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd() { setEditItem(null); setShowModal(true); }
  function openEdit(item: Debt) { setEditItem(item); setShowModal(true); }

  function handleSave(data: Omit<Debt, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateDebt(id, patch);
    } else {
      addDebt({ ...data, dataSource: "Manual Entry" });
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) { deleteDebt(id); setDeletingId(null); }
    else setDeletingId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Debts</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Liabilities and debt payoff tracking</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff" }}>
          <Plus size={15} /> Add Debt
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Debt" value={fmt(total, true)} icon={CreditCard} accent="red" />
        <StatCard title="Min. Payments" value={fmt(totalMinPayments)} sub="per month" accent="amber" />
        <StatCard title="Avg. Interest Rate" value={fmtPct(avgRate)} sub="Weighted by balance" accent="purple" />
        <StatCard title="Accounts" value={String(debts.length)} sub="Active debts" accent="blue" />
      </div>

      {/* Payoff projection */}
      {debts.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Payoff Projection</CardTitle>
          <p className="text-xs mt-1 mb-5" style={{ color: "var(--text-muted)" }}>
            Based on current balances and minimum monthly payments
          </p>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                type="number"
                dataKey="month"
                domain={[0, displayMonths]}
                ticks={yearTicks}
                tickFormatter={(m) => String(new Date().getFullYear() + m / 12)}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
                labelFormatter={(month) =>
                  Number(month) === 0 ? "Today" : monthToDate(Number(month))
                }
                formatter={(value, _name, props) => {
                  const proj = projections.find(p => p.debt.id === props.dataKey);
                  return [fmt(Number(value)), proj?.debt.name ?? String(_name)];
                }}
              />
              {projections.map((p) => (
                <Area
                  key={p.debt.id}
                  type="monotone"
                  dataKey={p.debt.id}
                  stackId="stack"
                  stroke={p.color}
                  fill={p.color}
                  fillOpacity={0.72}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          {/* Per-debt summary */}
          <div className="mt-5 pt-4 border-t overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Debt", "Balance", "Min. Payment", "Payoff Date", "Total Interest"].map((h) => (
                    <th key={h} className="pb-2.5 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projections.map((p, i) => (
                  <tr key={p.debt.id} style={{ borderBottom: i < projections.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{p.debt.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: "var(--accent-red)" }}>{fmt(p.debt.balance)}</td>
                    <td className="py-2.5 pr-4" style={{ color: "var(--text-secondary)" }}>{fmt(p.debt.minimumPayment)}/mo</td>
                    <td className="py-2.5 pr-4">
                      {p.payoffMonth !== null
                        ? <span style={{ color: "var(--accent-green)" }}>{monthToDate(p.payoffMonth)}</span>
                        : <span style={{ color: "var(--accent-red)" }}>Payment too low</span>}
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-secondary)" }}>
                      {p.totalInterest !== null ? fmt(p.totalInterest) : "—"}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td className="pt-3 pb-1 font-semibold" style={{ color: "var(--text-primary)" }}>Total</td>
                  <td className="pt-3 pb-1 font-semibold" style={{ color: "var(--accent-red)" }}>{fmt(total)}</td>
                  <td className="pt-3 pb-1 font-semibold" style={{ color: "var(--text-secondary)" }}>{fmt(totalMinPayments)}/mo</td>
                  <td className="pt-3 pb-1" style={{ color: lastPayoffMonth ? "var(--accent-green)" : "var(--text-muted)" }}>
                    {lastPayoffMonth ? monthToDate(lastPayoffMonth) : "—"}
                  </td>
                  <td className="pt-3 pb-1 font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {totalInterestAll !== null ? fmt(totalInterestAll) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Debt cards */}
      {debts.length === 0 ? (
        <div className="rounded-xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <EmptyState icon={CreditCard} title="No debts added" description="Track your mortgage, car loans, student loans, and credit cards here." action="Add Debt" onAction={openAdd} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {debts.map((debt) => {
            const paidPct = debt.originalBalance > 0
              ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100
              : 0;
            return (
              <div key={debt.id} className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{debt.name}</p>
                    {debt.owner && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{debt.owner}</p>}
                    {debt.lender && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{debt.lender}</p>}
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      {debt.dataSource || "Manual Entry"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-elevated)", color: categoryColors[debt.category] }}>
                      {categoryLabels[debt.category]}
                    </span>
                    <button onClick={() => openEdit(debt)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                      <Pencil size={13} />
                    </button>
                    {deletingId === debt.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDeleteClick(debt.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => handleDeleteClick(debt.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Balance</p>
                    <p className="text-base font-semibold mt-0.5" style={{ color: "var(--accent-red)" }}>{fmt(debt.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rate</p>
                    <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{fmtPct(debt.interestRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Min. Payment</p>
                    <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{fmt(debt.minimumPayment)}/mo</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-muted)" }}>{fmtPct(paidPct, 0)} paid off</span>
                    <span style={{ color: "var(--text-muted)" }}>Original: {fmt(debt.originalBalance)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                    <div className="h-full rounded-full" style={{ width: `${paidPct}%`, background: categoryColors[debt.category] }} />
                  </div>
                </div>

                {debt.notes && <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{debt.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editItem ? "Edit Debt" : "Add Debt"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <DebtForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
