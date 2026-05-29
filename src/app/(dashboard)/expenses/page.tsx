"use client";

import { useState } from "react";
import { Receipt, Plus, Pencil, Trash2 } from "lucide-react";
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
import { CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseForm } from "@/components/forms/expense-form";
import { useFinanceStore } from "@/store/finance-store";
import { monthlyExpenses, toMonthly, fmt } from "@/lib/finance";
import type { Expense } from "@/types";

const categoryColors: Record<string, string> = {
  housing: "var(--accent-blue)",
  utilities: "var(--accent-green)",
  food: "var(--accent-amber)",
  transport: "var(--accent-purple)",
  insurance: "var(--accent-red)",
  healthcare: "var(--accent-red)",
  savings: "var(--accent-green)",
  debt: "var(--accent-red)",
  subscriptions: "var(--text-secondary)",
  entertainment: "var(--accent-amber)",
  education: "var(--accent-blue)",
  clothing: "var(--accent-purple)",
  personal: "var(--text-muted)",
  other: "var(--text-muted)",
};

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = monthlyExpenses(expenses);
  const fixed = expenses.filter((e) => e.isFixed).reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);
  const variable = total - fixed;
  const essential = expenses.filter((e) => e.isEssential).reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    const m = toMonthly(e.amount, e.frequency);
    acc[e.category] = (acc[e.category] || 0) + m;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: Math.round(amount),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  function openAdd() { setEditItem(null); setShowModal(true); }
  function openEdit(item: Expense) { setEditItem(item); setShowModal(true); }

  function handleSave(data: Omit<Expense, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateExpense(id, patch);
    } else {
      addExpense(data);
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) { deleteExpense(id); setDeletingId(null); }
    else setDeletingId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Expenses</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Monthly spending breakdown</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff" }}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Monthly" value={fmt(total)} icon={Receipt} accent="red" />
        <StatCard title="Fixed Expenses" value={fmt(fixed)} sub="Recurring, predictable" accent="blue" />
        <StatCard title="Variable Expenses" value={fmt(variable)} sub="Fluctuates month-to-month" accent="amber" />
        <StatCard title="Essential" value={fmt(essential)} sub="Non-discretionary" accent="purple" />
      </div>

      {expenses.length > 0 && <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Spending by Category</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 16 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis dataKey="category" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }}
              formatter={(v) => [fmt(Number(v)), "Monthly"]}
            />
            <Bar dataKey="amount" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>}

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>All Expenses</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Expense", "Category", "Amount", "Frequency", "Monthly", "Type", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr><td colSpan={7}>
                <EmptyState icon={Receipt} title="No expenses yet" description="Add your first expense to start tracking your household spending." action="Add Expense" onAction={openAdd} />
              </td></tr>
            )}
            {expenses.map((exp, i) => {
              const monthly = exp.frequency === "once" ? exp.amount : toMonthly(exp.amount, exp.frequency);
              return (
                <tr key={exp.id} style={{ borderBottom: i < expenses.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{exp.name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ background: "var(--bg-elevated)", color: categoryColors[exp.category] || "var(--text-muted)" }}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{fmt(exp.amount)}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>{exp.frequency}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: "var(--accent-red)" }}>
                    {fmt(monthly)}
                    {exp.frequency === "once" && <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>once</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: exp.isFixed ? "var(--accent-blue-dim)" : "var(--bg-muted)", color: exp.isFixed ? "var(--accent-blue)" : "var(--text-muted)" }}>
                        {exp.isFixed ? "Fixed" : "Variable"}
                      </span>
                      {exp.isEssential && (
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>Essential</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {deletingId === exp.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Delete?</span>
                        <button onClick={() => handleDeleteClick(exp.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteClick(exp.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? "Edit Expense" : "Add Expense"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <ExpenseForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
