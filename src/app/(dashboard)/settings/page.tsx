"use client";

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { useFinanceStore } from "@/store/finance-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const householdName = useFinanceStore((s) => s.householdName);
  const updateHouseholdName = useFinanceStore((s) => s.updateHouseholdName);
  const clearSupabaseData = useFinanceStore((s) => s.clearSupabaseData);
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "pending" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState("");

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

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus("error");
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setPasswordStatus("pending");
    setPasswordError("");
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
      setPasswordError(error.message);
    } else {
      setPasswordStatus("saved");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    }
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

  async function handleDeleteAccount() {
    setDeleteStatus("pending");
    setDeleteError("");
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteStatus("error");
      setDeleteError(body.error || "Something went wrong. Please try again.");
      return;
    }
    clearSupabaseData();
    await createClient().auth.signOut();
    router.push("/login");
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

          {/* Password */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <CardTitle>Password</CardTitle>
            <form onSubmit={handleSavePassword} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordStatus("idle"); setPasswordError(""); }}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordStatus("idle"); setPasswordError(""); }}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="lg:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordStatus === "pending" || !newPassword || !confirmPassword}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: "var(--accent-blue)",
                    color: "#fff",
                    opacity: (passwordStatus === "pending" || !newPassword || !confirmPassword) ? 0.5 : 1,
                  }}
                >
                  {passwordStatus === "pending" ? "Saving…" : "Update password"}
                </button>
                {passwordStatus === "saved" && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: "var(--accent-green)" }}>
                    <Check size={14} /> Password updated
                  </span>
                )}
                {passwordStatus === "error" && (
                  <span className="text-sm" style={{ color: "var(--accent-red)" }}>{passwordError}</span>
                )}
              </div>
            </form>
          </div>
          {/* Delete Account */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <CardTitle>Delete Account</CardTitle>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Permanently delete your account and all associated data — income, expenses, assets, debts, retirement accounts, and projects. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}
              >
                <Trash2 size={14} /> Delete my account
              </button>
            ) : (
              <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: "var(--accent-red)", background: "var(--accent-red-dim)" }}>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--accent-red)" }}>
                  Are you sure? This will permanently delete all your data and cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteStatus === "pending"}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "var(--accent-red)", color: "#fff", opacity: deleteStatus === "pending" ? 0.6 : 1 }}
                  >
                    {deleteStatus === "pending" ? "Deleting…" : "Yes, delete everything"}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); setDeleteStatus("idle"); }}
                    disabled={deleteStatus === "pending"}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                  >
                    Cancel
                  </button>
                </div>
                {deleteStatus === "error" && (
                  <p className="mt-2 text-xs" style={{ color: "var(--accent-red)" }}>{deleteError}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
