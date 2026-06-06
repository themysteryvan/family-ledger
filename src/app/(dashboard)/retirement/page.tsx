"use client";

import { useState } from "react";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { RetirementForm } from "@/components/forms/retirement-form";
import { FilterBar } from "@/components/ui/filter-bar";
import { useFinanceStore } from "@/store/finance-store";
import { filterByOwner, fmt } from "@/lib/finance";
import type { RetirementAccount } from "@/types";

const typeLabels: Record<string, string> = {
  "401k": "401(k)",
  roth_401k: "Roth 401(k)",
  ira: "Traditional IRA",
  roth_ira: "Roth IRA",
  "403b": "403(b)",
  sep_ira: "SEP IRA",
  pension: "Pension",
};

const typeColors: Record<string, string> = {
  "401k": "#3b82f6",
  roth_401k: "#10b981",
  ira: "#a78bfa",
  roth_ira: "#f59e0b",
  "403b": "#22d3ee",
  sep_ira: "#f87171",
  pension: "#6b7280",
};

export default function RetirementPage() {
  const allAccounts = useFinanceStore((s) => s.retirementAccounts);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);
  const accounts = filterByOwner(allAccounts, ownerFilter);
  const addRetirementAccount = useFinanceStore((s) => s.addRetirementAccount);
  const updateRetirementAccount = useFinanceStore((s) => s.updateRetirementAccount);
  const deleteRetirementAccount = useFinanceStore((s) => s.deleteRetirementAccount);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RetirementAccount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalContributionsYtd = accounts.reduce((s, a) => s + (a.contributionYtd ?? 0), 0);
  const taxAdvantaged = accounts.filter((a) => a.type !== "pension").reduce((s, a) => s + a.balance, 0);
  const rothBalance = accounts.filter((a) => a.type === "roth_401k" || a.type === "roth_ira").reduce((s, a) => s + a.balance, 0);

  function openAdd() { setEditItem(null); setShowModal(true); }
  function openEdit(item: RetirementAccount) { setEditItem(item); setShowModal(true); }

  function handleSave(data: Omit<RetirementAccount, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateRetirementAccount(id, patch);
    } else {
      addRetirementAccount({ ...data, dataSource: "Manual Entry" });
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) { deleteRetirementAccount(id); setDeletingId(null); }
    else setDeletingId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Retirement</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>401(k), IRA, and other retirement accounts</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <FilterBar />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff" }}>
            <Plus size={15} /> Add Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={fmt(totalBalance, true)} icon={PiggyBank} accent="purple" />
        <StatCard title="Tax-Advantaged" value={fmt(taxAdvantaged, true)} sub="All non-pension accounts" accent="blue" />
        <StatCard title="Roth Balance" value={fmt(rothBalance, true)} sub="Roth 401(k) + Roth IRA" accent="green" />
        <StatCard title="Contributions YTD" value={fmt(totalContributionsYtd)} sub="All accounts combined" accent="amber" />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Account Details</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Account", "Type", "Owner", "Balance", "Contrib. YTD", "Employer Match", "Data Source", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr><td colSpan={8}>
                <EmptyState icon={PiggyBank} title="No retirement accounts yet" description="Add your 401(k), IRA, and other retirement accounts to track your long-term savings." action="Add Account" onAction={openAdd} />
              </td></tr>
            )}
            {accounts.map((acct, i) => (
              <tr key={acct.id} style={{ borderBottom: i < accounts.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{acct.name}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-elevated)", color: typeColors[acct.type] || "var(--text-muted)" }}>
                    {typeLabels[acct.type] ?? acct.type}
                  </span>
                </td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{acct.owner || "—"}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: "var(--accent-purple)" }}>{fmt(acct.balance)}</td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                  {acct.contributionYtd != null ? (
                    <span>
                      {fmt(acct.contributionYtd)}
                      {acct.annualContributionLimit != null && (
                        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                          / {fmt(acct.annualContributionLimit)}
                        </span>
                      )}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                  {acct.employerMatchPct != null ? `${acct.employerMatchPct}%` : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                    {acct.dataSource || "Manual Entry"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {deletingId === acct.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Delete?</span>
                      <button onClick={() => handleDeleteClick(acct.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(acct)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteClick(acct.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
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

      {accounts.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <CardTitle>Contribution Progress</CardTitle>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {accounts.filter((a) => a.annualContributionLimit != null && a.contributionYtd != null).map((acct) => {
              const pct = Math.min(((acct.contributionYtd ?? 0) / acct.annualContributionLimit!) * 100, 100);
              return (
                <div key={acct.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{acct.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% of limit</span>
                      <span className="font-semibold w-32 text-right" style={{ color: "var(--text-primary)" }}>
                        {fmt(acct.contributionYtd!)} / {fmt(acct.annualContributionLimit!)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "var(--accent-green)" : pct >= 75 ? "var(--accent-blue)" : "var(--accent-amber)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editItem ? "Edit Account" : "Add Retirement Account"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <RetirementForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
