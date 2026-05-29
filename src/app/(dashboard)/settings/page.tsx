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
  const [nameSaved, setNameSaved] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
      setEmailInput(user?.email ?? "");
    });
  }, []);

  useEffect(() => {
    if (householdName !== null) setNameInput(householdName);
  }, [householdName]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await updateHouseholdName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || trimmed === userEmail) return;
    setEmailStatus("pending");
    setEmailError("");
    const { error } = await createClient().auth.updateUser({ email: trimmed });
    if (error) {
      setEmailStatus("error");
      setEmailError(error.message);
    } else {
      setEmailStatus("sent");
    }
  }

  const inputStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

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

      {!userEmail ? (
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sign in to manage your settings.</p>
        </div>
      ) : (
        <>
          {/* Household name */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <CardTitle>Household Name</CardTitle>
            <form onSubmit={handleSaveName} className="mt-4 flex items-end gap-3">
              <div className="flex-1">
                <input
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameSaved(false); }}
                  placeholder="e.g. The Smith Family"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
                style={{ background: "var(--accent-blue)", color: "#fff", opacity: nameInput.trim() ? 1 : 0.5 }}
              >
                Save
              </button>
              {nameSaved && (
                <span className="flex items-center gap-1 text-sm flex-shrink-0" style={{ color: "var(--accent-green)" }}>
                  <Check size={14} /> Saved
                </span>
              )}
            </form>
          </div>

          {/* Email */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <CardTitle>Account Email</CardTitle>
            <form onSubmit={handleSaveEmail} className="mt-4 flex items-end gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setEmailStatus("idle"); setEmailError(""); }}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={emailStatus === "pending" || !emailInput.trim() || emailInput.trim() === userEmail}
                className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
                style={{
                  background: "var(--accent-blue)",
                  color: "#fff",
                  opacity: (emailStatus === "pending" || !emailInput.trim() || emailInput.trim() === userEmail) ? 0.5 : 1,
                }}
              >
                {emailStatus === "pending" ? "Saving…" : "Save"}
              </button>
            </form>
            {emailStatus === "sent" && (
              <p className="mt-2 text-xs" style={{ color: "var(--accent-green)" }}>
                Confirmation email sent to {emailInput.trim()}. Click the link to complete the change.
              </p>
            )}
            {emailStatus === "error" && (
              <p className="mt-2 text-xs" style={{ color: "var(--accent-red)" }}>{emailError}</p>
            )}
          </div>
        </>
      )}

      {/* Data status */}
      <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <CardTitle>Data</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            { label: "Supabase", status: isLoadedFromSupabase ? "Connected" : "Demo mode", ok: isLoadedFromSupabase },
            { label: "Bank sync (Plaid)", status: "Not connected", ok: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
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
