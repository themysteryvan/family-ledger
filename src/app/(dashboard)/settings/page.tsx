"use client";

import { Settings } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Family profile and app configuration
        </p>
      </div>

      {/* Profile */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <CardTitle>Family Profile</CardTitle>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { label: "Family Name", value: "Henderson" },
            { label: "Primary Currency", value: "USD" },
            { label: "Fiscal Year Start", value: "January" },
            { label: "Budget Period", value: "Monthly" },
          ].map((field) => (
            <div key={field.label}>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {field.label}
              </label>
              <input
                defaultValue={field.value}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <CardTitle>Family Members</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            { name: "Jake Henderson", role: "Primary", initials: "JH" },
            { name: "Sarah Henderson", role: "Partner", initials: "SH" },
          ].map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{
                  background: "var(--accent-blue-dim)",
                  color: "var(--accent-blue)",
                }}
              >
                {member.initials}
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <CardTitle>Data & Integrations</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            { label: "Supabase Database", status: "Not connected", ok: false },
            { label: "Bank sync (Plaid)", status: "Not connected", ok: false },
            { label: "Mock data", status: "Active", ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: item.ok
                    ? "var(--accent-green-dim)"
                    : "var(--bg-muted)",
                  color: item.ok ? "var(--accent-green)" : "var(--text-muted)",
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
