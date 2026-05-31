"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, X, Loader2, Download } from "lucide-react";
import { useFinanceStore } from "@/store/finance-store";
import { fmt } from "@/lib/finance";
import { CategorySelect } from "@/components/ui/category-select";
import { EXPENSE_CATEGORIES } from "@/components/forms/expense-form";
import type { Expense, Income, Asset, Debt, RetirementAccount, FrequencyType } from "@/types";

interface ExcelImportResult {
  incomes: Omit<Income, "id">[];
  expenses: Omit<Expense, "id">[];
  assets: Omit<Asset, "id">[];
  debts: Omit<Debt, "id">[];
  retirementAccounts: Omit<RetirementAccount, "id">[];
}

const CATEGORY_MAP: Record<string, Expense["category"]> = {
  housing: "housing",
  utilities: "utilities",
  food: "food",
  transport: "transport",
  kids: "education",
  health: "healthcare",
  insurance: "insurance",
  entertainment: "entertainment",
  personal: "personal",
  pets: "other",
  savings: "savings",
  other: "other",
};

const ESSENTIAL_CATEGORIES = new Set<Expense["category"]>(["housing", "utilities", "food", "healthcare", "insurance"]);


const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "annually", label: "Annual" },
];

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  frequency: FrequencyType;
  dataSource: string;
  category: Expense["category"];
  aiCategory: Expense["category"] | null;
  include: boolean;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  function col(row: string[], ...names: string[]): string {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return (row[idx] || "").trim().replace(/^["']|["']$/g, "");
    }
    return "";
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);

    const desc = col(cells, "description", "merchant", "memo", "payee", "name", "details");
    const dateStr = col(cells, "date", "posted", "transaction date", "trans date");

    let amount = 0;
    const debit = col(cells, "debit", "withdrawal", "charge");
    const credit = col(cells, "credit", "deposit");
    const rawAmount = col(cells, "amount");

    if (debit) {
      amount = Math.abs(parseFloat(debit.replace(/[$,]/g, "")) || 0);
    } else if (rawAmount) {
      const parsed = parseFloat(rawAmount.replace(/[$,]/g, "")) || 0;
      amount = Math.abs(parsed);
      if (parsed > 0 && credit) continue;
    }

    if (!desc || amount === 0) continue;

    rows.push({ id: `${i}-${Date.now()}`, date: dateStr || "", description: desc, amount, frequency: "once", dataSource: "Bank Statement", category: "other", aiCategory: null, include: true });
  }
  return rows;
}

async function parsePDF(file: File): Promise<ParsedRow[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "PDF parsing failed");
  }

  const { transactions } = await res.json() as {
    transactions: Array<{ date: string; description: string; amount: number }>;
  };

  return transactions.map((t, i) => ({
    id: `pdf-${i}-${Date.now()}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    frequency: "once" as FrequencyType,
    dataSource: "Bank Statement",
    category: "other" as Expense["category"],
    aiCategory: null,
    include: true,
  }));
}

async function categorizeWithAI(rows: ParsedRow[]): Promise<Record<string, Expense["category"]>> {
  const res = await fetch("/api/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactions: rows.map((r, i) => ({ index: i, description: r.description, amount: r.amount })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Categorization failed");
  }

  const { categories } = await res.json() as { categories: Record<string, string> };
  const result: Record<string, Expense["category"]> = {};
  for (const [idx, label] of Object.entries(categories)) {
    result[idx] = CATEGORY_MAP[label.toLowerCase()] ?? "other";
  }
  return result;
}

type Stage = "upload" | "parsing" | "categorizing" | "review" | "excel-review" | "done";

export default function ImportPage() {
  const { addExpense, addIncome, addAsset, addDebt, addRetirementAccount } = useFinanceStore();
  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [excelData, setExcelData] = useState<ExcelImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "pdf" | "xlsx">("csv");
  const fileRef = useRef<HTMLInputElement>(null);

  const runCategorization = useCallback(async (parsed: ParsedRow[]) => {
    setStage("categorizing");
    try {
      const BATCH = 50;
      const updated = [...parsed];
      for (let start = 0; start < parsed.length; start += BATCH) {
        const batch = parsed.slice(start, start + BATCH);
        const mapping = await categorizeWithAI(batch);
        for (const [idxStr, cat] of Object.entries(mapping)) {
          const globalIdx = start + parseInt(idxStr, 10);
          if (updated[globalIdx]) {
            updated[globalIdx] = { ...updated[globalIdx], category: cat, aiCategory: cat };
          }
        }
      }
      setRows(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI categorization failed.");
      setRows(parsed.map((r) => ({ ...r, aiCategory: null })));
    }
    setStage("review");
  }, []);

  const processFile = useCallback(async (file: File) => {
    const isPDF = file.name.toLowerCase().endsWith(".pdf");
    const isCSV = file.name.toLowerCase().endsWith(".csv");
    const isXLSX = file.name.toLowerCase().endsWith(".xlsx");

    if (!isPDF && !isCSV && !isXLSX) {
      setError("Please upload a CSV, PDF, or Excel (.xlsx) file.");
      return;
    }

    if (isXLSX) {
      setError(null);
      setFileName(file.name);
      setFileType("xlsx");
      setStage("parsing");
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-excel", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || "Excel parsing failed");
        }
        const data = await res.json() as ExcelImportResult;
        const total = data.incomes.length + data.expenses.length + data.assets.length + data.debts.length + data.retirementAccounts.length;
        if (total === 0) {
          setError("No data found in the Excel file. Make sure you filled in the tabs and deleted the example rows.");
          setStage("upload");
          return;
        }
        setExcelData(data);
        setStage("excel-review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Excel parsing failed.");
        setStage("upload");
      }
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileType(isPDF ? "pdf" : "csv");

    if (isPDF) {
      setStage("parsing");
      let parsed: ParsedRow[];
      try {
        parsed = await parsePDF(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDF parsing failed.");
        setStage("upload");
        return;
      }
      if (parsed.length === 0) {
        setError("No transactions found in this PDF.");
        setStage("upload");
        return;
      }
      setRows(parsed);
      await runCategorization(parsed);
    } else {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No transactions found. Make sure the CSV has Date, Description, and Amount columns.");
        return;
      }
      setRows(parsed);
      await runCategorization(parsed);
    }
  }, [runCategorization]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function updateRow(id: string, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function confirmImport() {
    const toImport = rows.filter((r) => r.include);
    for (const row of toImport) {
      addExpense({
        name: row.description,
        amount: row.amount,
        frequency: row.frequency,
        dataSource: row.dataSource,
        category: row.category,
        isFixed: false,
        isEssential: ESSENTIAL_CATEGORIES.has(row.category),
        notes: row.date ? `Imported transaction: ${row.date}` : "Imported transaction",
      });
    }
    setStage("done");
  }

  function confirmExcelImport() {
    if (!excelData) return;
    excelData.incomes.forEach((item) => addIncome(item));
    excelData.expenses.forEach((item) => addExpense(item));
    excelData.assets.forEach((item) => addAsset(item));
    excelData.debts.forEach((item) => addDebt(item));
    excelData.retirementAccounts.forEach((item) => addRetirementAccount(item));
    setStage("done");
  }

  function reset() {
    setStage("upload");
    setRows([]);
    setExcelData(null);
    setError(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const includedCount = rows.filter((r) => r.include).length;
  const totalAmount = rows.filter((r) => r.include).reduce((s, r) => s + r.amount, 0);

  const parsingLabel = stage === "parsing"
    ? { title: "Reading PDF…", sub: "Extracting transaction text from your statement" }
    : { title: `Analyzing ${rows.length} transactions…`, sub: "Claude is categorizing your spending" };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Import Transactions</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload a bank statement or CSV export and let AI categorize your transactions</p>
        </div>
        <a
          href="/api/download-template"
          download="family-ledger-template.xlsx"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Download size={14} />
          Download Template
        </a>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "var(--accent-red-dim)", border: "1px solid var(--accent-red)" }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-red)" }} />
          <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0" style={{ color: "var(--accent-red)" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Upload */}
      {stage === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-20 transition-colors"
          style={{
            borderColor: isDragging ? "var(--accent-blue)" : "var(--border)",
            background: isDragging ? "var(--accent-blue-dim)" : "var(--bg-surface)",
          }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--bg-elevated)" }}>
            <Upload size={26} style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>Drop a file here, or click to browse</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Supports CSV exports, PDF bank statements, and Excel templates</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "CSV", desc: "Chase, BoA, Citi…" },
              { label: "PDF", desc: "Bank statements" },
              { label: "XLSX", desc: "Family Ledger template" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                <FileText size={13} style={{ color: "var(--accent-blue)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs px-6 text-center" style={{ color: "var(--text-muted)" }}>
            PDF must be text-based (not a scanned image). CSV needs date, description, and amount columns.
          </p>
          <input ref={fileRef} type="file" accept=".csv,.pdf,.xlsx" className="hidden" onChange={onFileInput} />
        </div>
      )}

      {/* Parsing / categorizing spinner */}
      {(stage === "parsing" || stage === "categorizing") && (
        <div className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--accent-blue-dim)" }}>
            <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{parsingLabel.title}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{parsingLabel.sub}</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            <Sparkles size={13} style={{ color: "var(--accent-blue)" }} />
            Powered by Claude claude-sonnet-4-5
          </div>
        </div>
      )}

      {/* Review */}
      {stage === "review" && (
        <>
          <div className="flex items-center justify-between rounded-xl border px-5 py-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>File</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileText size={13} style={{ color: fileType === "pdf" ? "var(--accent-red)" : "var(--accent-blue)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fileName}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium uppercase" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                    {fileType}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Selected</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{includedCount} of {rows.length}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent-red)" }}>{fmt(totalAmount)}</p>
              </div>
              {!error && (
                <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
                  <Sparkles size={12} />
                  AI categorized
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={reset} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
                Start over
              </button>
              <button
                onClick={confirmImport}
                disabled={includedCount === 0}
                className="text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-40"
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                Import {includedCount} transaction{includedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={rows.every((r) => r.include)}
                      onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, include: e.target.checked })))}
                      style={{ accentColor: "var(--accent-blue)" }}
                    />
                  </th>
                  {["Date", "Description", "Amount", "Frequency", "Category", "AI?"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none", opacity: row.include ? 1 : 0.4 }}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={row.include} onChange={(e) => updateRow(row.id, { include: e.target.checked })} style={{ accentColor: "var(--accent-blue)" }} />
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{row.date || "—"}</td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <p className="truncate font-medium" style={{ color: "var(--text-primary)" }}>{row.description}</p>
                    </td>
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "var(--accent-red)" }}>{fmt(row.amount)}</td>
                    <td className="px-4 py-2.5 min-w-[130px]">
                      <select
                        value={row.frequency}
                        onChange={(e) => updateRow(row.id, { frequency: e.target.value as FrequencyType })}
                        className="w-full rounded-md px-2 py-1 text-xs"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", outline: "none" }}
                      >
                        {FREQUENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 min-w-[160px]">
                      <CategorySelect
                        value={row.category}
                        options={EXPENSE_CATEGORIES}
                        onChange={(v) => updateRow(row.id, { category: v as Expense["category"] })}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      {row.aiCategory ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>AI</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>manual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Excel review */}
      {stage === "excel-review" && excelData && (() => {
        const sections = [
          { label: "Income", count: excelData.incomes.length, color: "var(--accent-green)", items: excelData.incomes.map((r) => ({ name: r.name, detail: `${fmt(r.amount)} · ${r.frequency}` })) },
          { label: "Expenses", count: excelData.expenses.length, color: "var(--accent-red)", items: excelData.expenses.map((r) => ({ name: r.name, detail: `${fmt(r.amount)} · ${r.frequency}` })) },
          { label: "Assets", count: excelData.assets.length, color: "var(--accent-blue)", items: excelData.assets.map((r) => ({ name: r.name, detail: fmt(r.value) })) },
          { label: "Debts", count: excelData.debts.length, color: "var(--accent-amber)", items: excelData.debts.map((r) => ({ name: r.name, detail: fmt(r.balance) })) },
          { label: "Retirement", count: excelData.retirementAccounts.length, color: "var(--accent-purple)", items: excelData.retirementAccounts.map((r) => ({ name: r.name, detail: fmt(r.balance) })) },
        ].filter((s) => s.count > 0);
        const total = sections.reduce((s, sec) => s + sec.count, 0);
        return (
          <>
            <div className="flex items-center justify-between rounded-xl border px-5 py-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>File</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText size={13} style={{ color: "var(--accent-green)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fileName}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium uppercase" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>xlsx</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Records found</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{total} across {sections.length} tab{sections.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={reset} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>Cancel</button>
                <button onClick={confirmExcelImport} className="text-sm font-medium px-5 py-2 rounded-lg" style={{ background: "var(--accent-blue)", color: "#fff" }}>
                  Import {total} record{total !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {sections.map((sec) => (
                <div key={sec.label} className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: sec.color }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{sec.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{sec.count}</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {sec.items.map((item, i) => (
                      <div key={i} className="px-5 py-2.5 flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Done */}
      {stage === "done" && (
        <div className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--accent-green-dim)" }}>
            <CheckCircle size={26} style={{ color: "var(--accent-green)" }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>Import complete!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {excelData
                ? `${(excelData.incomes.length + excelData.expenses.length + excelData.assets.length + excelData.debts.length + excelData.retirementAccounts.length)} records imported across all sections`
                : `${includedCount} transaction${includedCount !== 1 ? "s" : ""} (${fmt(totalAmount)}) added to your expenses`}
            </p>
          </div>
          <button onClick={reset} className="text-sm font-medium px-5 py-2 rounded-lg" style={{ background: "var(--accent-blue)", color: "#fff" }}>
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
