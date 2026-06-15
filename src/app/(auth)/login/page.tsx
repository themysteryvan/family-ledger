"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";

type Mode = "signin" | "signup" | "forgot";
type LegalModal = "terms" | "privacy" | "ai" | null;

// ── Legal document content ────────────────────────────────────────────────────

function TermsContent() {
  return (
    <div className="space-y-4 text-sm" style={{ color: "var(--text-secondary)" }}>
      <p style={{ color: "var(--text-muted)" }}>Effective date: June 2026</p>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Use of the Platform</h3>
        <p>Standing Ledger is a personal finance tracking tool intended for informational and organizational purposes. By creating an account, you agree to use the platform only for lawful purposes and in accordance with these terms. You are responsible for maintaining the security of your account credentials.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No Guarantee of Accuracy</h3>
        <p>Standing Ledger makes no representations or warranties about the accuracy, completeness, or suitability of any information displayed on the platform. Financial calculations, projections, and AI-generated insights are provided as estimates only and may contain errors.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>User Responsibility</h3>
        <p>You are solely responsible for all financial decisions you make, including any decisions influenced by information or analysis provided by this platform. Standing Ledger does not provide financial, tax, legal, or investment advice. Always consult a qualified professional before making significant financial decisions.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No Liability for Data Loss</h3>
        <p>Standing Ledger is not liable for any loss, corruption, or unauthorized access to data entered into the platform. You are responsible for maintaining independent backups of any important financial information. We do not guarantee uninterrupted availability of the service.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Account Termination</h3>
        <p>We reserve the right to suspend or terminate your account at any time, with or without cause, including for violation of these terms. You may delete your account at any time through the Settings page. Upon termination, your data may be deleted from our systems.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Prohibited Uses</h3>
        <p>You may not use Standing Ledger to: (a) violate any applicable law or regulation; (b) attempt to gain unauthorized access to any part of the platform; (c) transmit harmful, fraudulent, or malicious content; (d) reverse engineer or attempt to extract the source code of the platform; or (e) use the platform for any commercial resale purpose without written consent.</p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4 text-sm" style={{ color: "var(--text-secondary)" }}>
      <p style={{ color: "var(--text-muted)" }}>Effective date: June 2026</p>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>What Data We Collect</h3>
        <p>We collect the following information when you use Standing Ledger:</p>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li><strong>Account information:</strong> your email address and hashed password, used solely to authenticate you.</li>
          <li><strong>Financial data you enter:</strong> income sources, expenses, assets, debts, retirement accounts, and financial projects that you voluntarily input into the platform.</li>
          <li><strong>Usage metadata:</strong> timestamps of account creation and terms acceptance.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>How Your Data Is Stored</h3>
        <p>All account and financial data is stored securely using Supabase, a hosted database platform that uses PostgreSQL with row-level security. Data is encrypted at rest and in transit. Your financial data is logically isolated per account and cannot be accessed by other users.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Data Sharing</h3>
        <p>We do not sell, rent, or share your personal or financial data with any third parties for marketing or commercial purposes. Your data is not used to train AI models. The only third-party service with access to your data is Supabase (for storage) and Anthropic (for AI analysis features, only when you explicitly use them — no data is retained by Anthropic after processing).</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Your Right to Delete</h3>
        <p>You may delete your account and all associated data at any time through the Settings page. Upon deletion, your financial data will be permanently removed from our systems. Email-based account records may be retained for a short period to prevent abuse, then permanently deleted.</p>
      </section>
    </div>
  );
}

function AIDisclaimerContent() {
  return (
    <div className="space-y-4 text-sm" style={{ color: "var(--text-secondary)" }}>
      <p style={{ color: "var(--text-muted)" }}>Effective date: June 2026</p>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Informational Purposes Only</h3>
        <p>The AI Analysis features in Standing Ledger (including the AI advisor chatbot and AI-generated financial insights) are provided for informational and educational purposes only. They are not intended to constitute financial, investment, tax, or legal advice of any kind.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Not a Substitute for Professional Advice</h3>
        <p>AI-generated outputs are not a substitute for advice from a licensed financial advisor, certified public accountant, attorney, or other qualified professional. You should always consult a licensed professional before making significant financial decisions, including but not limited to investment choices, debt restructuring, tax planning, and retirement planning.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>AI Outputs May Be Inaccurate</h3>
        <p>AI language models can produce responses that are incomplete, outdated, or factually incorrect. Financial data, tax laws, interest rates, and market conditions change frequently. Standing Ledger makes no warranty that AI-generated analysis reflects current laws, regulations, or market conditions. Always independently verify any figures or recommendations produced by the AI.</p>
      </section>

      <section>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>User Assumes All Responsibility</h3>
        <p>By using the AI Analysis features, you acknowledge that you are solely responsible for any financial decisions made based on, or influenced by, outputs generated by the AI. Standing Ledger, its operators, and its affiliates accept no liability for losses, damages, or negative outcomes resulting from reliance on AI-generated content.</p>
      </section>
    </div>
  );
}

// ── Main login page ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<LegalModal>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setSuccessMsg(null);
    setTermsAccepted(false);
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { terms_accepted_at: new Date().toISOString() },
        },
      });
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

  const submitDisabled = loading || (mode === "signup" && !termsAccepted);

  const legalTitles: Record<NonNullable<LegalModal>, string> = {
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    ai: "AI & Financial Disclaimer",
  };

  return (
    <>
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

            {/* Terms acceptance — signup only */}
            {mode === "signup" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-[var(--accent-blue)]"
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("terms")}
                    className="underline hover:no-underline"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Terms & Conditions
                  </button>
                  {", "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("privacy")}
                    className="underline hover:no-underline"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Privacy Policy
                  </button>
                  {", and "}
                  <button
                    type="button"
                    onClick={() => setLegalModal("ai")}
                    className="underline hover:no-underline"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    AI & Financial Disclaimer
                  </button>
                  .
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Legal modals */}
      {legalModal && (
        <Modal title={legalTitles[legalModal]} onClose={() => setLegalModal(null)} size="lg">
          {legalModal === "terms" && <TermsContent />}
          {legalModal === "privacy" && <PrivacyContent />}
          {legalModal === "ai" && <AIDisclaimerContent />}
        </Modal>
      )}
    </>
  );
}
