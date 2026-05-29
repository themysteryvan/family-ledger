"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { useFinanceStore } from "@/store/finance-store";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const householdName = useFinanceStore((s) => s.householdName);
  const isLoadedFromSupabase = useFinanceStore((s) => s.isLoadedFromSupabase);
  const updateHouseholdName = useFinanceStore((s) => s.updateHouseholdName);

  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  // Sync input when store loads
  useEffect(() => {
    if (householdName !== null) setNameInput(householdName);
  }, [householdName]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await updateHouseholdName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Household profile and app configuration
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Household Profile</CardTitle>

        {!userEmail ? (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in to manage your household settings.
          </p>
        ) : (
          <form onSubmit={handleSaveName} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Household Name
              </label>
              <input
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setSaved(false); }}
                placeholder="e.g. The Smith Family"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Account Email
              </label>
              <input
                value={userEmail}
                disabled
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "not-allowed",
                }}
              />
            </div>
            <div className="lg:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent-blue)", color: "#fff", opacity: nameInput.trim() ? 1 : 0.5 }}
              >
                Save changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--accent-green)" }}>
                  <Check size={14} /> Saved
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Data status */}
      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Data</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            {
              label: "Supabase",
              status: isLoadedFromSupabase ? "Connected" : "Demo mode",
              ok: isLoadedFromSupabase,
            },
            { label: "Bank sync (Plaid)", status: "Not connected", ok: false },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: item.ok ? "var(--accent-green-dim)" : "var(--bg-muted)",
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
