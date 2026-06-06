"use client";

import { useState } from "react";
import { TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
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
import { IncomeForm } from "@/components/forms/income-form";
import { FilterBar } from "@/components/ui/filter-bar";
import { useFinanceStore } from "@/store/finance-store";
import { monthlyIncome, filterByOwner, toMonthly, fmt, fmtPct } from "@/lib/finance";
import type { Income } from "@/types";

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
  const allIncomes = useFinanceStore((s) => s.incomes);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);
  const incomes = filterByOwner(allIncomes, ownerFilter);
  const addIncome = useFinanceStore((s) => s.addIncome);
  const updateIncome = useFinanceStore((s) => s.updateIncome);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Income | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalMonthly = monthlyIncome(incomes);
  const totalAnnual = totalMonthly * 12;

  const ownerTotals = incomes.reduce((acc, inc) => {
    if (!inc.isActive) return acc;
    acc[inc.owner] = (acc[inc.owner] || 0) + toMonthly(inc.amount, inc.frequency);
    return acc;
  }, {} as Record<string, number>);

  const ownerChartData = Object.entries(ownerTotals).map(([owner, monthly]) => ({
    owner,
    monthly: Math.round(monthly),
  }));

  function openAdd() {
    setEditItem(null);
    setShowModal(true);
  }

  function openEdit(item: Income) {
    setEditItem(item);
    setShowModal(true);
  }

  function handleSave(data: Omit<Income, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateIncome(id, patch);
    } else {
      addIncome({ ...data, dataSource: "Manual Entry" });
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) {
      deleteIncome(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Income
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            All household income sources
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <FilterBar />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent-blue)", color: "#fff" }}
          >
            <Plus size={15} /> Add Income
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Income" value={fmt(totalMonthly)} icon={TrendingUp} accent="green" trend="up" trendLabel="Active sources" />
        <StatCard title="Annual Income" value={fmt(totalAnnual)} accent="blue" />
        {Object.entries(ownerTotals).slice(0, 2).map(([owner, total], i) => (
          <StatCard key={owner} title={owner} value={fmt(total)} sub="per month" accent={i === 0 ? "purple" : "amber"} />
        ))}
      </div>

      {/* Charts — only shown when there is data */}
      {incomes.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Monthly by Owner</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ownerChartData} margin={{ top: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="owner" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }}
                formatter={(v) => [fmt(Number(v)), "Monthly"]}
              />
              <Bar dataKey="monthly" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Income Sources</CardTitle>
          <div className="mt-3 space-y-2">
            {incomes.filter((i) => i.isActive).map((inc) => {
              const monthly = toMonthly(inc.amount, inc.frequency);
              const pct = totalMonthly > 0 ? (monthly / totalMonthly) * 100 : 0;
              return (
                <div key={inc.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: categoryColors[inc.category] }} />
                      <span style={{ color: "var(--text-secondary)" }}>{inc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtPct(pct, 0)}</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{fmt(monthly)}/mo</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: categoryColors[inc.category] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>All Income Sources</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Source", "Owner", "Category", "Amount", "Frequency", "Monthly", "Status", "Data Source", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incomes.length === 0 && (
              <tr><td colSpan={9}>
                <EmptyState icon={TrendingUp} title="No income sources yet" description="Add your first income source to start tracking your household earnings." action="Add Income" onAction={openAdd} />
              </td></tr>
            )}
            {incomes.map((inc, i) => (
              <tr
                key={inc.id}
                style={{ borderBottom: i < incomes.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{inc.name}</td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{inc.owner}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-elevated)", color: categoryColors[inc.category] }}>
                    {categoryLabels[inc.category]}
                  </span>
                </td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{fmt(inc.amount)}</td>
                <td className="px-5 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>{inc.frequency}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: "var(--accent-green)" }}>{fmt(toMonthly(inc.amount, inc.frequency))}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: inc.isActive ? "var(--accent-green-dim)" : "var(--bg-muted)", color: inc.isActive ? "var(--accent-green)" : "var(--text-muted)" }}>
                    {inc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                    {inc.dataSource || "Manual Entry"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {deletingId === inc.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Delete?</span>
                      <button onClick={() => handleDeleteClick(inc.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(inc)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteClick(inc.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editItem ? "Edit Income" : "Add Income Source"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <IncomeForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
