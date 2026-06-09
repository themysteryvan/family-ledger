"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload, FileText, Sparkles, CheckCircle, AlertCircle, X,
  Loader2, Download, Camera, ChevronDown, ChevronRight,
} from "lucide-react";
import { useFinanceStore } from "@/store/finance-store";
import { fmt } from "@/lib/finance";
import { CategorySelect } from "@/components/ui/category-select";
import { EXPENSE_CATEGORIES } from "@/components/forms/expense-form";
import type { Expense, Income, Asset, Debt, RetirementAccount } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TransactionType = "expense" | "income" | "debt_payment" | "transfer" | "skip";

interface ExcelImportResult {
  incomes: Omit<Income, "id">[];
  expenses: Omit<Expense, "id">[];
  assets: Omit<Asset, "id">[];
  debts: Omit<Debt, "id">[];
  retirementAccounts: Omit<RetirementAccount, "id">[];
}

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  dataSource: string;
  category: Expense["category"];
  aiCategory: Expense["category"] | null;
  txType: TransactionType;
  include: boolean;
}

interface ImportSummary {
  income: number;
  expenses: number;
  debtPayments: number;
}

type Stage = "upload" | "parsing" | "categorizing" | "review" | "excel-review" | "done";

// ── Display groups ─────────────────────────────────────────────────────────────

interface DisplayGroup {
  key: string;
  label: string;
  types: TransactionType[];
  color: string;
}

const DISPLAY_GROUPS: DisplayGroup[] = [
  { key: "income",       label: "Income",            types: ["income"],              color: "var(--accent-green)"  },
  { key: "expense",      label: "Expenses",           types: ["expense"],             color: "var(--accent-red)"    },
  { key: "debt_payment", label: "Debt Payments",      types: ["debt_payment"],        color: "var(--accent-amber)"  },
  { key: "transfer",     label: "Transfers & Skip",   types: ["transfer", "skip"],    color: "var(--text-muted)"    },
];

const TX_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense",      label: "Expense"      },
  { value: "income",       label: "Income"       },
  { value: "debt_payment", label: "Debt Payment" },
  { value: "transfer",     label: "Transfer"     },
  { value: "skip",         label: "Skip"         },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, Expense["category"]> = {
  housing: "housing", utilities: "utilities", food: "food", transport: "transport",
  kids: "education", health: "healthcare", insurance: "insurance",
  entertainment: "entertainment", personal: "personal", pets: "other",
  savings: "savings", other: "other",
};

const ESSENTIAL_CATEGORIES = new Set<Expense["category"]>(["housing", "utilities", "food", "healthcare", "insurance"]);

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseCSV(text: string): Array<{ date: string; description: string; amount: number }> {
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

  const results: Array<{ date: string; description: string; amount: number }> = [];

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
    results.push({ date: dateStr || "", description: desc, amount });
  }

  return results;
}

async function parsePDF(file: File): Promise<Array<{ date: string; description: string; amount: number }>> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "PDF parsing failed");
  }

  const { transactions } = await res.json() as {
    transactions: Array<{ date: string; description: string; amount: number }>;
  };
  return transactions;
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height / width) * MAX);
          width = MAX;
        } else {
          width = Math.round((width / height) * MAX);
          height = MAX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D context unavailable")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas compression produced no output")); return; }
          const outName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], outName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.8,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image for compression")); };
    img.src = url;
  });
}

async function parseImage(file: File): Promise<Array<{ date: string; description: string; amount: number }>> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-image", { method: "POST", body: formData });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let message = `HTTP ${res.status}`;
    try { message = (JSON.parse(raw) as { error?: string }).error || message; } catch { message = raw || message; }
    throw new Error(message);
  }

  const { transactions } = await res.json() as {
    transactions: Array<{ date: string; description: string; amount: number }>;
  };
  return transactions;
}

async function categorizeWithAI(
  rawRows: Array<{ date: string; description: string; amount: number }>
): Promise<ParsedRow[]> {
  const BATCH = 50;
  const result: ParsedRow[] = rawRows.map((r, i) => ({
    id: `row-${i}-${Date.now()}`,
    date: r.date,
    description: r.description,
    amount: r.amount,
    dataSource: "Bank Statement",
    category: "other" as Expense["category"],
    aiCategory: null,
    txType: "expense" as TransactionType,
    include: true,
  }));

  for (let start = 0; start < rawRows.length; start += BATCH) {
    const batch = rawRows.slice(start, start + BATCH);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: batch.map((r, i) => ({ index: i, description: r.description, amount: r.amount })),
        }),
      });

      if (!res.ok) continue;

      const { categories } = await res.json() as {
        categories: Record<string, { category: string; type: string } | string>;
      };

      for (const [idxStr, val] of Object.entries(categories)) {
        const globalIdx = start + parseInt(idxStr, 10);
        if (!result[globalIdx]) continue;

        const catRaw = typeof val === "object" ? val.category : val;
        const typeRaw = typeof val === "object" ? val.type : "expense";

        const cat = (CATEGORY_MAP[catRaw?.toLowerCase?.()] ?? "other") as Expense["category"];
        const txType = (["expense", "income", "debt_payment", "transfer", "skip"].includes(typeRaw)
          ? typeRaw
          : "expense") as TransactionType;

        result[globalIdx] = {
          ...result[globalIdx],
          category: cat,
          aiCategory: cat,
          txType,
          include: txType !== "transfer" && txType !== "skip",
        };
      }
    } catch {
      // leave batch as-is on error
    }
  }

  return result;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { addExpense, addIncome, addAsset, addDebt, addRetirementAccount } = useFinanceStore();

  const [stage, setStage] = useState<Stage>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [excelData, setExcelData] = useState<ExcelImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "pdf" | "xlsx" | "image">("csv");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(["transfer"]));
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [parsingLabel, setParsingLabel] = useState({ title: "", sub: "" });

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function updateRow(id: string, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroupAll(groupRows: ParsedRow[], selectAll: boolean) {
    const ids = new Set(groupRows.map((r) => r.id));
    setRows((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, include: selectAll } : r)));
  }

  // ── File processing ────────────────────────────────────────────────────────

  const processTransactions = useCallback(async (
    rawTxs: Array<{ date: string; description: string; amount: number }>,
    source: string
  ) => {
    setParsingLabel({ title: `Analyzing ${rawTxs.length} transactions…`, sub: "Claude is categorizing your spending" });
    setStage("categorizing");

    const categorized = await categorizeWithAI(rawTxs);
    const withSource = categorized.map((r) => ({ ...r, dataSource: source }));
    setRows(withSource);
    setStage("review");
  }, []);

  const processFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    const isPDF = name.endsWith(".pdf");
    const isCSV = name.endsWith(".csv");
    const isXLSX = name.endsWith(".xlsx");
    const isImage = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i.test(name) || file.type.startsWith("image/");

    if (!isPDF && !isCSV && !isXLSX && !isImage) {
      setError("Please upload a CSV, PDF, Excel (.xlsx), or image file (JPG, PNG, WebP).");
      return;
    }

    setError(null);
    setFileName(file.name);

    if (isXLSX) {
      setFileType("xlsx");
      setStage("parsing");
      setParsingLabel({ title: "Reading spreadsheet…", sub: "Extracting data from your Excel template" });
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-excel", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error((err as { error?: string }).error || "Excel parsing failed");
        }
        const data = await res.json() as ExcelImportResult;
        const total = data.incomes.length + data.expenses.length + data.assets.length +
          data.debts.length + data.retirementAccounts.length;
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

    if (isPDF) {
      setFileType("pdf");
      setStage("parsing");
      setParsingLabel({ title: "Reading PDF…", sub: "Extracting transaction text from your statement" });
      try {
        const txs = await parsePDF(file);
        if (txs.length === 0) {
          setError("No transactions found in this PDF.");
          setStage("upload");
          return;
        }
        await processTransactions(txs, "Bank Statement");
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDF parsing failed.");
        setStage("upload");
      }
      return;
    }

    if (isImage) {
      setFileType("image");
      setStage("parsing");
      setParsingLabel({ title: "Compressing image…", sub: "Resizing to fit within upload limits" });
      try {
        const compressed = await compressImage(file);
        setParsingLabel({ title: "Reading image…", sub: "Claude is extracting transactions from your photo" });
        const txs = await parseImage(compressed);
        if (txs.length === 0) {
          setError("No transactions found in this image.");
          setStage("upload");
          return;
        }
        await processTransactions(txs, "Photo / Screenshot");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Image parsing failed.");
        setStage("upload");
      }
      return;
    }

    // CSV
    setFileType("csv");
    const text = await file.text();
    const txs = parseCSV(text);
    if (txs.length === 0) {
      setError("No transactions found. Make sure the CSV has Date, Description, and Amount columns.");
      return;
    }
    await processTransactions(txs, "Bank Statement");
  }, [processTransactions]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  // ── Confirm import ─────────────────────────────────────────────────────────

  function confirmImport() {
    const toImport = rows.filter((r) => r.include);
    let incomeCount = 0;
    let expenseCount = 0;
    let debtCount = 0;

    for (const row of toImport) {
      const notes = row.date ? `Imported: ${row.date}` : "Imported transaction";

      if (row.txType === "income") {
        addIncome({
          name: row.description,
          amount: row.amount,
          frequency: "once",
          category: "other",
          owner: "",
          isActive: true,
          dataSource: row.dataSource,
          notes,
        });
        incomeCount++;
      } else if (row.txType === "expense") {
        addExpense({
          name: row.description,
          amount: row.amount,
          frequency: "once",
          category: row.category,
          isFixed: false,
          isEssential: ESSENTIAL_CATEGORIES.has(row.category),
          dataSource: row.dataSource,
          notes,
        });
        expenseCount++;
      } else if (row.txType === "debt_payment") {
        addExpense({
          name: row.description,
          amount: row.amount,
          frequency: "once",
          category: "debt",
          isFixed: false,
          isEssential: false,
          dataSource: row.dataSource,
          notes,
        });
        debtCount++;
      }
      // transfer/skip: intentionally skipped
    }

    setImportSummary({ income: incomeCount, expenses: expenseCount, debtPayments: debtCount });
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
    setImportSummary(null);
    setCollapsedGroups(new Set(["transfer"]));
  }

  // ── Derived values for review ──────────────────────────────────────────────

  const includedCount = rows.filter((r) => r.include).length;
  const totalIncluded = rows.filter((r) => r.include).reduce((s, r) => s + r.amount, 0);

  const activeGroups = DISPLAY_GROUPS.map((g) => ({
    ...g,
    rows: rows.filter((r) => g.types.includes(r.txType)),
  })).filter((g) => g.rows.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Import Transactions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Upload a bank statement or CSV export and let AI categorize your transactions
          </p>
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

      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--accent-red-dim)", border: "1px solid var(--accent-red)" }}
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-red)" }} />
          <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0" style={{ color: "var(--accent-red)" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Upload stage */}
      {stage === "upload" && (
        <div className="space-y-4">
          {/* Drag-drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 py-16 transition-colors"
            style={{
              borderColor: isDragging ? "var(--accent-blue)" : "var(--border)",
              background: isDragging ? "var(--accent-blue-dim)" : "var(--bg-surface)",
            }}
          >
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{ background: "var(--bg-elevated)" }}
            >
              <Upload size={26} style={{ color: "var(--accent-blue)" }} />
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                Drop a file here, or click to browse
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                CSV exports, PDF statements, Excel templates, or images
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {[
                { label: "CSV",  desc: "Chase, BoA, Citi…"       },
                { label: "PDF",  desc: "Bank statements"          },
                { label: "XLSX", desc: "Family Ledger template"   },
                { label: "IMG",  desc: "Receipt or screenshot"    },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <FileText size={13} style={{ color: "var(--accent-blue)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs px-6 text-center" style={{ color: "var(--text-muted)" }}>
              PDF must be text-based (not a scanned image). CSV needs date, description, and amount columns.
            </p>
            {/* Hidden file input for browse */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.pdf,.xlsx,.jpg,.jpeg,.png,.gif,.webp,image/*"
              className="hidden"
              onChange={onFileInput}
            />
          </div>

          {/* Camera option */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>
          <button
            onClick={() => cameraRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            <Camera size={18} style={{ color: "var(--accent-blue)" }} />
            Take a photo or upload an image
            <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>JPG, PNG, WebP</span>
          </button>
          {/* Hidden camera input */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileInput}
          />
        </div>
      )}

      {/* Parsing / categorizing spinner */}
      {(stage === "parsing" || stage === "categorizing") && (
        <div
          className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: "var(--accent-blue-dim)" }}
          >
            <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{parsingLabel.title}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{parsingLabel.sub}</p>
          </div>
          <div
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-full"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            <Sparkles size={13} style={{ color: "var(--accent-blue)" }} />
            Powered by Claude
          </div>
        </div>
      )}

      {/* Review stage — grouped */}
      {stage === "review" && (
        <>
          {/* Summary bar */}
          <div
            className="flex items-center justify-between rounded-xl border px-5 py-4"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>File</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileText
                    size={13}
                    style={{
                      color: fileType === "pdf" ? "var(--accent-red)"
                        : fileType === "image" ? "var(--accent-purple)"
                        : "var(--accent-blue)",
                    }}
                  />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fileName}</p>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium uppercase"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                  >
                    {fileType}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Selected</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  {includedCount} of {rows.length}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent-red)" }}>
                  {fmt(totalIncluded)}
                </p>
              </div>
              {rows.some((r) => r.aiCategory) && (
                <div
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}
                >
                  <Sparkles size={12} />
                  AI categorized
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
              >
                Start over
              </button>
              <button
                onClick={confirmImport}
                disabled={includedCount === 0}
                className="text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-40"
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                Import {includedCount} item{includedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          {/* Grouped sections */}
          <div className="space-y-4">
            {activeGroups.map((group) => {
              const allSelected = group.rows.length > 0 && group.rows.every((r) => r.include);
              const someSelected = group.rows.some((r) => r.include);
              const groupTotal = group.rows.filter((r) => r.include).reduce((s, r) => s + r.amount, 0);
              const isCollapsed = collapsedGroups.has(group.key);

              return (
                <div
                  key={group.key}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  {/* Group header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    style={{ borderBottom: isCollapsed ? "none" : "1px solid var(--border-subtle)" }}
                    onClick={() => toggleCollapse(group.key)}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleGroupAll(group.rows, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: group.color, flexShrink: 0 }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: group.color }}
                    />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {group.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    >
                      {group.rows.length}
                    </span>
                    {someSelected && (
                      <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                        {fmt(groupTotal)}
                      </span>
                    )}
                    <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
                      {isCollapsed
                        ? <ChevronRight size={15} />
                        : <ChevronDown size={15} />
                      }
                    </span>
                  </div>

                  {/* Group rows */}
                  {!isCollapsed && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <th className="px-4 py-2 text-left w-10" />
                          {["Date", "Description", "Amount", "Category", "Type"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2 text-left text-xs font-medium"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, i) => (
                          <tr
                            key={row.id}
                            style={{
                              borderBottom: i < group.rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
                              opacity: row.include ? 1 : 0.4,
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <input
                                type="checkbox"
                                checked={row.include}
                                onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                                style={{ accentColor: "var(--accent-blue)" }}
                              />
                            </td>
                            <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                              {row.date || "—"}
                            </td>
                            <td className="px-4 py-2.5 max-w-xs">
                              <p className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                                {row.description}
                              </p>
                            </td>
                            <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "var(--accent-red)" }}>
                              {fmt(row.amount)}
                            </td>
                            <td className="px-4 py-2.5 min-w-[160px]">
                              {row.txType === "expense" || row.txType === "debt_payment" ? (
                                <CategorySelect
                                  value={row.category}
                                  options={EXPENSE_CATEGORIES}
                                  onChange={(v) => updateRow(row.id, { category: v as Expense["category"] })}
                                />
                              ) : (
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 min-w-[140px]">
                              <select
                                value={row.txType}
                                onChange={(e) => {
                                  const newType = e.target.value as TransactionType;
                                  updateRow(row.id, {
                                    txType: newType,
                                    include: newType !== "transfer" && newType !== "skip",
                                  });
                                }}
                                className="w-full rounded-md px-2 py-1 text-xs"
                                style={{
                                  background: "var(--bg-elevated)",
                                  color: "var(--text-primary)",
                                  border: "1px solid var(--border)",
                                  outline: "none",
                                }}
                              >
                                {TX_TYPE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Excel review — unchanged */}
      {stage === "excel-review" && excelData && (() => {
        const sections = [
          { label: "Income",     count: excelData.incomes.length,            color: "var(--accent-green)",  items: excelData.incomes.map((r)             => ({ name: r.name, detail: `${fmt(r.amount)} · ${r.frequency}` })) },
          { label: "Expenses",   count: excelData.expenses.length,           color: "var(--accent-red)",    items: excelData.expenses.map((r)            => ({ name: r.name, detail: `${fmt(r.amount)} · ${r.frequency}` })) },
          { label: "Assets",     count: excelData.assets.length,             color: "var(--accent-blue)",   items: excelData.assets.map((r)              => ({ name: r.name, detail: fmt(r.value) })) },
          { label: "Debts",      count: excelData.debts.length,              color: "var(--accent-amber)",  items: excelData.debts.map((r)               => ({ name: r.name, detail: fmt(r.balance) })) },
          { label: "Retirement", count: excelData.retirementAccounts.length, color: "var(--accent-purple)", items: excelData.retirementAccounts.map((r)  => ({ name: r.name, detail: fmt(r.balance) })) },
        ].filter((s) => s.count > 0);
        const total = sections.reduce((s, sec) => s + sec.count, 0);

        return (
          <>
            <div
              className="flex items-center justify-between rounded-xl border px-5 py-4"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>File</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText size={13} style={{ color: "var(--accent-green)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fileName}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium uppercase"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    >
                      xlsx
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Records found</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {total} across {sections.length} tab{sections.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExcelImport}
                  className="text-sm font-medium px-5 py-2 rounded-lg"
                  style={{ background: "var(--accent-blue)", color: "#fff" }}
                >
                  Import {total} record{total !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {sections.map((sec) => (
                <div
                  key={sec.label}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div
                    className="px-5 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: sec.color }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{sec.label}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full ml-1"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    >
                      {sec.count}
                    </span>
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
        <div
          className="rounded-xl border flex flex-col items-center justify-center gap-5 py-20"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: "var(--accent-green-dim)" }}
          >
            <CheckCircle size={26} style={{ color: "var(--accent-green)" }} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>Import complete!</p>
            {importSummary ? (
              <div className="space-y-0.5">
                {importSummary.income > 0 && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {importSummary.income} income item{importSummary.income !== 1 ? "s" : ""} added
                  </p>
                )}
                {importSummary.expenses > 0 && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {importSummary.expenses} expense{importSummary.expenses !== 1 ? "s" : ""} added
                  </p>
                )}
                {importSummary.debtPayments > 0 && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {importSummary.debtPayments} debt payment{importSummary.debtPayments !== 1 ? "s" : ""} added
                  </p>
                )}
              </div>
            ) : excelData ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {excelData.incomes.length + excelData.expenses.length + excelData.assets.length +
                  excelData.debts.length + excelData.retirementAccounts.length} records imported across all sections
              </p>
            ) : null}
          </div>
          <button
            onClick={reset}
            className="text-sm font-medium px-5 py-2 rounded-lg"
            style={{ background: "var(--accent-blue)", color: "#fff" }}
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
