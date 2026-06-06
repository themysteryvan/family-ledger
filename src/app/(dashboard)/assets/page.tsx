"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { AssetForm } from "@/components/forms/asset-form";
import { useFinanceStore } from "@/store/finance-store";
import { totalAssets, fmt } from "@/lib/finance";
import type { Asset } from "@/types";

const categoryColors: Record<string, string> = {
  real_estate: "#3b82f6",
  retirement: "#a78bfa",
  investment: "#10b981",
  cash: "#f59e0b",
  vehicle: "#f87171",
  crypto: "#22d3ee",
  other: "#6b7280",
};

const categoryLabels: Record<string, string> = {
  real_estate: "Real Estate",
  retirement: "Retirement",
  investment: "Investment",
  cash: "Cash",
  vehicle: "Vehicle",
  crypto: "Crypto",
  other: "Other",
};

export default function AssetsPage() {
  const assets = useFinanceStore((s) => s.assets);
  const addAsset = useFinanceStore((s) => s.addAsset);
  const updateAsset = useFinanceStore((s) => s.updateAsset);
  const deleteAsset = useFinanceStore((s) => s.deleteAsset);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = totalAssets(assets);
  const realEstate = assets.filter((a) => a.category === "real_estate").reduce((s, a) => s + a.value, 0);
  const retirement = assets.filter((a) => a.category === "retirement").reduce((s, a) => s + a.value, 0);
  const liquid = assets.filter((a) => a.category === "cash").reduce((s, a) => s + a.value, 0);

  const categoryTotals = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + a.value;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([cat, val]) => ({
    name: categoryLabels[cat] || cat,
    value: val,
    color: categoryColors[cat] || "#6b7280",
  }));

  function openAdd() { setEditItem(null); setShowModal(true); }
  function openEdit(item: Asset) { setEditItem(item); setShowModal(true); }

  function handleSave(data: Omit<Asset, "id"> & { id?: string }) {
    if (data.id) {
      const { id, ...patch } = data;
      updateAsset(id, patch);
    } else {
      addAsset({ ...data, dataSource: "Manual Entry" });
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleDeleteClick(id: string) {
    if (deletingId === id) { deleteAsset(id); setDeletingId(null); }
    else setDeletingId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Assets</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>All household assets and their current value</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent-blue)", color: "#fff" }}>
          <Plus size={15} /> Add Asset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={fmt(total, true)} icon={Building2} accent="green" />
        <StatCard title="Real Estate" value={fmt(realEstate, true)} sub={total > 0 ? `${((realEstate / total) * 100).toFixed(0)}% of assets` : "0% of assets"} accent="blue" />
        <StatCard title="Retirement" value={fmt(retirement, true)} sub="401(k) + Roth IRA" accent="purple" />
        <StatCard title="Liquid Cash" value={fmt(liquid, true)} sub="Checking + HYSA" accent="amber" />
      </div>

      {assets.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>Asset Allocation</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }}
                formatter={(v) => [fmt(Number(v)), ""]}
              />
              <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CardTitle>By Category</CardTitle>
          <div className="mt-3 space-y-3">
            {[...pieData].sort((a, b) => b.value - a.value).map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(d.value)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div className="h-full rounded-full" style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CardTitle>Asset Details</CardTitle>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Asset", "Owner", "Category", "Current Value", "Purchase Price", "Gain/Loss", "Growth Rate", "Data Source", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr><td colSpan={9}>
                <EmptyState icon={Building2} title="No assets yet" description="Add your home, retirement accounts, investments, and savings to track your total wealth." action="Add Asset" onAction={openAdd} />
              </td></tr>
            )}
            {assets.map((asset, i) => {
              const gainLoss = asset.purchasePrice != null ? asset.value - asset.purchasePrice : null;
              return (
                <tr key={asset.id} style={{ borderBottom: i < assets.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{asset.name}</td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{asset.owner || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-elevated)", color: categoryColors[asset.category] || "var(--text-muted)" }}>
                      {categoryLabels[asset.category]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold" style={{ color: "var(--accent-green)" }}>{fmt(asset.value)}</td>
                  <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{asset.purchasePrice != null ? fmt(asset.purchasePrice) : "—"}</td>
                  <td className="px-5 py-3">
                    {gainLoss !== null ? (
                      <span style={{ color: gainLoss >= 0 ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 600 }}>
                        {gainLoss >= 0 ? "+" : ""}{fmt(gainLoss)}
                      </span>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {asset.appreciationRate !== undefined ? (
                      <span style={{ color: asset.appreciationRate >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {asset.appreciationRate > 0 ? "+" : ""}{asset.appreciationRate}%/yr
                      </span>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      {asset.dataSource || "Manual Entry"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {deletingId === asset.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Delete?</span>
                        <button onClick={() => handleDeleteClick(asset.id)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--accent-red)", background: "var(--accent-red-dim)" }}>Yes</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(asset)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-muted)" }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteClick(asset.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--accent-red-dim)]" style={{ color: "var(--text-muted)" }}>
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
        <Modal title={editItem ? "Edit Asset" : "Add Asset"} onClose={() => { setShowModal(false); setEditItem(null); }}>
          <AssetForm initial={editItem ?? undefined} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null); }} />
        </Modal>
      )}
    </div>
  );
}
