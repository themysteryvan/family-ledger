"use client";

import { useFinanceStore } from "@/store/finance-store";

export function FilterBar() {
  const members = useFinanceStore((s) => s.householdMembers);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);
  const setOwnerFilter = useFinanceStore((s) => s.setOwnerFilter);

  const buttons = [
    { label: "All", value: null },
    ...members.map((m) => ({ label: m.name, value: m.name })),
    { label: "Joint", value: "Joint" },
  ];

  return (
    <div className="grid gap-1.5" style={{ gridAutoFlow: "column", gridAutoColumns: "1fr" }}>
      {buttons.map(({ label, value }) => {
        const active = ownerFilter === value;
        return (
          <button
            key={label}
            onClick={() => setOwnerFilter(value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: active ? "var(--accent-blue)" : "var(--bg-elevated)",
              color: active ? "#fff" : "var(--text-secondary)",
              border: active ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
