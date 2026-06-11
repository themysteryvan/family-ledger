"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setSuccessMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "forgot") {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Check your email for a password reset link. It expires in 1 hour.");
      }
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("Signup error:", error);
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Sign in error:", error);
        setError(error.message);
      } else {
        // router.refresh() after router.push() can cancel the navigation in App Router
        router.push("/dashboard");
      }
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

      {/* Card */}
      <div
        className="rounded-2xl border p-7"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Mode toggle — only for signin/signup */}
        {mode !== "forgot" && (
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ background: "var(--bg-elevated)" }}
          >
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? "var(--bg-surface)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}

        {/* Forgot password header */}
        {mode === "forgot" && (
          <div className="mb-6">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Reset your password
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Enter your email and we'll send a reset link.
            </p>
          </div>
        )}

        {/* Error / success */}
        {error && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--accent-red-dim)", color: "var(--accent-red)" }}>
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs hover:underline"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "var(--accent-blue)", color: "#fff" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="w-full py-2 text-xs hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              ← Back to sign in
            </button>
          )}
        </form>
      </div>

      {/* Demo mode link */}
      <p className="text-center text-sm mt-5" style={{ color: "var(--text-muted)" }}>
        Just exploring?{" "}
        <a href="/dashboard" className="underline" style={{ color: "var(--accent-blue)" }}>
          Continue in demo mode
        </a>
      </p>
    </div>
  );
}
