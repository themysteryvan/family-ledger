"use client";

import { cn } from "@/lib/utils";

/* ── Field wrapper ─────────────────────────────────────────────── */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Base input style ──────────────────────────────────────────── */
const inputBase =
  "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors " +
  "focus:ring-1 focus:ring-[var(--accent-blue)] placeholder:text-[var(--text-muted)]";

const inputStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

/* ── Input ─────────────────────────────────────────────────────── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={inputBase}
      style={inputStyle}
      {...props}
    />
  );
}

/* ── Select ────────────────────────────────────────────────────── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={inputBase}
      style={{
        ...inputStyle,
        appearance: "auto",
      }}
      {...props}
    />
  );
}

/* ── Textarea ──────────────────────────────────────────────────── */
export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      rows={3}
      className={inputBase + " resize-none"}
      style={inputStyle}
      {...props}
    />
  );
}

/* ── Checkbox ──────────────────────────────────────────────────── */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-[var(--accent-blue)] cursor-pointer"
      />
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
    </label>
  );
}

/* ── Form action row ───────────────────────────────────────────── */
export function FormActions({
  onClose,
  submitLabel = "Save",
}: {
  onClose: () => void;
  submitLabel?: string;
}) {
  return (
    <div
      className="flex items-center justify-end gap-3 pt-4 mt-2 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ color: "var(--text-secondary)" }}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent-blue)", color: "#fff" }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
