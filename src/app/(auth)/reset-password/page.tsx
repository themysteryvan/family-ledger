"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Supabase fires PASSWORD_RECOVERY when it detects the recovery token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("ready");
      } else if (event === "SIGNED_IN" && state === "loading") {
        // Already have a valid session (e.g. user is logged in)
        router.replace("/dashboard");
      }
    });

    // If no event fires within 3 seconds, the token is missing or expired
    const timeout = setTimeout(() => {
      setState((s) => s === "loading" ? "invalid" : s);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setState("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: "var(--accent-blue-dim)" }}
        >
          <Wallet size={18} style={{ color: "var(--accent-blue)" }} />
        </span>
        <span className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Standing Ledger
        </span>
      </div>

      <div
        className="rounded-2xl border p-7"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={16} className="animate-spin" />
            Verifying reset link…
          </div>
        )}

        {state === "invalid" && (
          <div className="py-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--accent-red)" }}>
              <AlertCircle size={16} />
              This link is invalid or has expired.
            </div>
            <a href="/login" className="block text-xs hover:underline" style={{ color: "var(--accent-blue)" }}>
              Request a new reset link
            </a>
          </div>
        )}

        {state === "done" && (
          <div className="py-4 text-center text-sm" style={{ color: "var(--accent-green)" }}>
            Password updated! Redirecting…
          </div>
        )}

        {state === "ready" && (
          <>
            <div className="mb-6">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Choose a new password
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Must be at least 6 characters.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
