"use client";

import { useState } from "react";
import { Download, FileText, TrendingUp, BarChart3, DollarSign } from "lucide-react";
import { useFinanceStore } from "@/store/finance-store";
import {
  filterByOwner,
  toMonthly,
  monthlyIncome,
  monthlyExpenses,
  totalAssets,
  totalDebt,
  fmt,
  fmtPct,
} from "@/lib/finance";
import type {
  Income,
  Expense,
  Asset,
  Debt,
  RetirementAccount,
} from "@/types";

// ── Label helpers ──────────────────────────────────────────────────────────────

const ASSET_CATEGORY_LABELS: Record<Asset["category"], string> = {
  real_estate: "Real Estate",
  vehicle: "Vehicle",
  investment: "Investment",
  retirement: "Retirement",
  cash: "Cash & Savings",
  crypto: "Cryptocurrency",
  other: "Other",
};

const DEBT_CATEGORY_LABELS: Record<Debt["category"], string> = {
  mortgage: "Mortgage",
  auto: "Auto Loan",
  student: "Student Loan",
  credit_card: "Credit Card",
  personal: "Personal Loan",
  medical: "Medical",
  other: "Other",
};

const EXPENSE_CATEGORY_LABELS: Record<Expense["category"], string> = {
  housing: "Housing",
  utilities: "Utilities",
  food: "Food & Dining",
  transport: "Transport",
  insurance: "Insurance",
  healthcare: "Healthcare",
  education: "Education",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  clothing: "Clothing",
  personal: "Personal",
  savings: "Savings",
  debt: "Debt Payments",
  other: "Other",
};

const INCOME_CATEGORY_LABELS: Record<Income["category"], string> = {
  salary: "Salary",
  freelance: "Freelance",
  rental: "Rental",
  investment: "Investment",
  other: "Other",
};

// ── Date formatting ────────────────────────────────────────────────────────────

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

// ── Report data types ──────────────────────────────────────────────────────────

interface AssetAllocationRow {
  label: string;
  value: string;
  pct: string;
}

interface DebtSummaryRow {
  label: string;
  balance: string;
  pct: string;
}

interface RetirementRow {
  name: string;
  type: string;
  owner: string;
  balance: string;
}

interface AssetDetailRow {
  name: string;
  category: string;
  value: string;
  owner: string;
  notes: string;
}

interface DebtDetailRow {
  name: string;
  category: string;
  balance: string;
  rate: string;
  minPayment: string;
  owner: string;
}

interface IncomeRow {
  name: string;
  category: string;
  owner: string;
  monthly: string;
  annual: string;
}

interface ExpenseCategoryRow {
  category: string;
  monthly: string;
  pctOfIncome: string;
}

interface ReportData {
  householdName: string;
  ownerLabel: string;
  date: string;
  // Section 1
  totalAssets: string;
  totalDebt: string;
  netWorth: string;
  netWorthPositive: boolean;
  assetAllocation: AssetAllocationRow[];
  debtSummaryRows: DebtSummaryRow[];
  retirementRows: RetirementRow[];
  // Section 2
  assetDetails: AssetDetailRow[];
  debtDetails: DebtDetailRow[];
  // Section 3
  incomeRows: IncomeRow[];
  incomeTotalMonthly: string;
  incomeTotalAnnual: string;
  expenseCategoryRows: ExpenseCategoryRow[];
  totalMonthlyIncome: string;
  totalMonthlyExpenses: string;
  monthlyDebtPayments: string;
  monthlyCashFlow: string;
  cashFlowPositive: boolean;
  savingsRate: string;
  debtToIncome: string;
}

// ── HTML generator ─────────────────────────────────────────────────────────────

function generateReportHTML(data: ReportData): string {
  const retirementSection =
    data.retirementRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Retirement Accounts</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Account Name</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Type</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Owner</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.retirementRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.name}</td>
                <td style="padding:6px 8px;color:#374151;">${r.type}</td>
                <td style="padding:6px 8px;color:#374151;">${r.owner || "—"}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.balance}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const debtSummarySection =
    data.debtSummaryRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Debt Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Category</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Total Balance</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">% of Total Debt</th>
            </tr>
          </thead>
          <tbody>
            ${data.debtSummaryRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.label}</td>
                <td style="padding:6px 8px;text-align:right;color:#dc2626;">${r.balance}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.pct}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const retirementDetailSection =
    data.retirementRows.length > 0
      ? `
        <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Retirement Accounts</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Name</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Type</th>
              <th style="text-align:left;padding:6px 8px;color:#6b7280;font-weight:600;">Owner</th>
              <th style="text-align:right;padding:6px 8px;color:#6b7280;font-weight:600;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.retirementRows
              .map(
                (r) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;color:#111827;">${r.name}</td>
                <td style="padding:6px 8px;color:#374151;">${r.type}</td>
                <td style="padding:6px 8px;color:#374151;">${r.owner || "—"}</td>
                <td style="padding:6px 8px;text-align:right;color:#374151;">${r.balance}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.householdName} — Financial Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    }
    @media screen {
      body { max-width: 900px; margin: 40px auto; padding: 0 40px; }
    }
    @media print {
      @page { margin: 0.75in; }
    }
    /* Header */
    .doc-header {
      border-bottom: 2px solid #1e40af;
      padding-bottom: 16px;
      margin-bottom: 28px;
    }
    .doc-header h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .doc-header .subtitle {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
    .doc-header .meta {
      display: flex;
      gap: 24px;
      margin-top: 10px;
      font-size: 12px;
      color: #6b7280;
    }
    /* Sections */
    .section {
      margin-bottom: 36px;
      page-break-inside: avoid;
    }
    .section h2 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      font-weight: 700;
      color: #1e40af;
      border-top: 2px solid #1e40af;
      padding-top: 10px;
      margin-bottom: 16px;
    }
    /* Summary boxes */
    .summary-boxes {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-box {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      background: #f9fafb;
    }
    .summary-box .label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .summary-box .value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    .summary-box .value.green { color: #16a34a; }
    .summary-box .value.red   { color: #dc2626; }
    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { border-bottom: 1px solid #e5e7eb; }
    th {
      text-align: left;
      padding: 6px 8px;
      color: #6b7280;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    th.num, td.num { text-align: right; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:last-child { border-bottom: none; }
    td { padding: 7px 8px; color: #374151; }
    td.bold { color: #111827; font-weight: 600; }
    td.green { color: #16a34a; font-weight: 600; }
    td.red   { color: #dc2626; }
    tr.totals-row td {
      border-top: 1px solid #e5e7eb;
      font-weight: 700;
      color: #111827;
      background: #f9fafb;
    }
    /* Metrics list */
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 12px;
    }
    .metric-row {
      display: contents;
    }
    .metric-label {
      padding: 9px 14px;
      color: #6b7280;
      font-size: 12px;
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
    }
    .metric-value {
      padding: 9px 14px;
      color: #111827;
      font-size: 12px;
      font-weight: 600;
      border-bottom: 1px solid #f3f4f6;
      text-align: right;
    }
    .metric-value.green { color: #16a34a; }
    .metric-value.red   { color: #dc2626; }
    /* Footer */
    .report-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <!-- Document header -->
  <div class="doc-header">
    <h1>${data.householdName}</h1>
    <div class="subtitle">Financial Statement</div>
    <div class="meta">
      <span>Prepared: ${data.date}</span>
      <span>Scope: ${data.ownerLabel}</span>
    </div>
  </div>

  <!-- Section 1: Net Worth Summary -->
  <div class="section">
    <h2>Net Worth Summary</h2>

    <div class="summary-boxes">
      <div class="summary-box">
        <div class="label">Total Assets</div>
        <div class="value green">${data.totalAssets}</div>
      </div>
      <div class="summary-box">
        <div class="label">Total Debts</div>
        <div class="value red">${data.totalDebt}</div>
      </div>
      <div class="summary-box">
        <div class="label">Net Worth</div>
        <div class="value ${data.netWorthPositive ? "green" : "red"}">${data.netWorth}</div>
      </div>
    </div>

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Asset Allocation</h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="num">Total Value</th>
          <th class="num">% of Assets</th>
        </tr>
      </thead>
      <tbody>
        ${data.assetAllocation
          .map(
            (r) => `
          <tr>
            <td class="bold">${r.label}</td>
            <td class="num">${r.value}</td>
            <td class="num">${r.pct}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    ${debtSummarySection}
    ${retirementSection}
  </div>

  <!-- Section 2: Asset & Debt Detail -->
  <div class="section">
    <h2>Asset &amp; Debt Detail</h2>

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Assets</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th class="num">Current Value</th>
          <th>Owner</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.assetDetails.length > 0
            ? data.assetDetails
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td class="num">${r.value}</td>
            <td>${r.owner || "—"}</td>
            <td style="color:#9ca3af;">${r.notes || "—"}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="5" style="color:#9ca3af;padding:12px 8px;">No assets recorded.</td></tr>'
        }
      </tbody>
    </table>

    ${retirementDetailSection}

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Debts &amp; Liabilities</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th class="num">Balance</th>
          <th class="num">Interest Rate</th>
          <th class="num">Min. Payment</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.debtDetails.length > 0
            ? data.debtDetails
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td class="num red">${r.balance}</td>
            <td class="num">${r.rate}</td>
            <td class="num">${r.minPayment}</td>
            <td>${r.owner || "—"}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="6" style="color:#9ca3af;padding:12px 8px;">No debts recorded.</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <!-- Section 3: Income & Cash Flow -->
  <div class="section">
    <h2>Income &amp; Cash Flow</h2>

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">Monthly Income Sources</h3>
    <table>
      <thead>
        <tr>
          <th>Source Name</th>
          <th>Category</th>
          <th>Owner</th>
          <th class="num">Monthly</th>
          <th class="num">Annual</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.incomeRows.length > 0
            ? data.incomeRows
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.name}</td>
            <td>${r.category}</td>
            <td>${r.owner || "—"}</td>
            <td class="num green">${r.monthly}</td>
            <td class="num">${r.annual}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="5" style="color:#9ca3af;padding:12px 8px;">No income sources recorded.</td></tr>'
        }
        <tr class="totals-row">
          <td colspan="3">Total</td>
          <td class="num">${data.incomeTotalMonthly}</td>
          <td class="num">${data.incomeTotalAnnual}</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Monthly Expenses by Category</h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="num">Monthly Amount</th>
          <th class="num">% of Income</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.expenseCategoryRows.length > 0
            ? data.expenseCategoryRows
                .map(
                  (r) => `
          <tr>
            <td class="bold">${r.category}</td>
            <td class="num">${r.monthly}</td>
            <td class="num">${r.pctOfIncome}</td>
          </tr>`
                )
                .join("")
            : '<tr><td colspan="3" style="color:#9ca3af;padding:12px 8px;">No expenses recorded.</td></tr>'
        }
      </tbody>
    </table>

    <h3 style="font-size:13px;font-weight:600;color:#1e40af;margin:20px 0 8px;">Key Financial Metrics</h3>
    <div class="metrics">
      <div class="metric-label">Total Monthly Income</div>
      <div class="metric-value green">${data.totalMonthlyIncome}</div>
      <div class="metric-label">Total Monthly Expenses</div>
      <div class="metric-value">${data.totalMonthlyExpenses}</div>
      <div class="metric-label">Monthly Debt Payments</div>
      <div class="metric-value red">${data.monthlyDebtPayments}</div>
      <div class="metric-label">Monthly Cash Flow</div>
      <div class="metric-value ${data.cashFlowPositive ? "green" : "red"}">${data.monthlyCashFlow}</div>
      <div class="metric-label">Savings Rate</div>
      <div class="metric-value">${data.savingsRate}</div>
      <div class="metric-label">Debt-to-Income Ratio</div>
      <div class="metric-value">${data.debtToIncome}</div>
    </div>
  </div>

  <div class="report-footer">
    This report was generated by Family Ledger on ${data.date}. It is intended for informational purposes only.
  </div>
</body>
</html>`;
}

// ── Data computation ───────────────────────────────────────────────────────────

function buildReportData(
  householdName: string,
  ownerFilter: string | null,
  incomes: Income[],
  expenses: Expense[],
  assets: Asset[],
  debts: Debt[],
  retirementAccounts: RetirementAccount[]
): ReportData {
  const today = new Date();
  const date = formatDateLong(today);
  const ownerLabel = ownerFilter ?? "Full Household";

  // Filter by owner
  const filteredIncomes = filterByOwner(incomes, ownerFilter).filter((i) => i.isActive);
  const filteredExpenses = filterByOwner(expenses, ownerFilter);
  const filteredAssets = filterByOwner(assets, ownerFilter);
  const filteredDebts = filterByOwner(debts, ownerFilter);
  const filteredRetirement = filterByOwner(retirementAccounts, ownerFilter);

  // Totals
  const retirementTotal = filteredRetirement.reduce((s, a) => s + a.balance, 0);
  const assetsTotal = totalAssets(filteredAssets) + retirementTotal;
  const debtTotal = totalDebt(filteredDebts);
  const netWorthVal = assetsTotal - debtTotal;
  const incomeMonthly = monthlyIncome(
    filterByOwner(incomes, ownerFilter).filter((i) => i.isActive)
  );
  const expenseMonthly = monthlyExpenses(filteredExpenses);
  const debtPayments = filteredDebts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0);
  const cashFlow = incomeMonthly - expenseMonthly - debtPayments;
  const savingsRate = incomeMonthly > 0 ? (cashFlow / incomeMonthly) * 100 : 0;
  const dti = incomeMonthly > 0 ? (debtPayments / incomeMonthly) * 100 : 0;

  // Asset allocation — group by category, include retirement as a bucket
  type AssetCategoryKey = Asset["category"] | "retirement_accounts";
  const assetGroups: Record<AssetCategoryKey, number> = {
    real_estate: 0,
    vehicle: 0,
    investment: 0,
    retirement: 0,
    cash: 0,
    crypto: 0,
    other: 0,
    retirement_accounts: retirementTotal,
  };
  for (const a of filteredAssets) {
    assetGroups[a.category] += a.value;
  }

  const assetAllocation: AssetAllocationRow[] = (
    Object.entries(assetGroups) as [AssetCategoryKey, number][]
  )
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, val]) => ({
      label:
        cat === "retirement_accounts"
          ? "Retirement Accounts"
          : ASSET_CATEGORY_LABELS[cat as Asset["category"]],
      value: fmt(val),
      pct: assetsTotal > 0 ? fmtPct((val / assetsTotal) * 100) : "0.0%",
    }));

  // Debt summary
  const debtGroups: Partial<Record<Debt["category"], number>> = {};
  for (const d of filteredDebts) {
    debtGroups[d.category] = (debtGroups[d.category] ?? 0) + d.balance;
  }
  const debtSummaryRows: DebtSummaryRow[] = (
    Object.entries(debtGroups) as [Debt["category"], number][]
  )
    .sort(([, a], [, b]) => b - a)
    .map(([cat, bal]) => ({
      label: DEBT_CATEGORY_LABELS[cat],
      balance: fmt(bal),
      pct: debtTotal > 0 ? fmtPct((bal / debtTotal) * 100) : "0.0%",
    }));

  // Retirement rows
  const retirementRows: RetirementRow[] = filteredRetirement
    .sort((a, b) => b.balance - a.balance)
    .map((r) => ({
      name: r.name,
      type: r.type.toUpperCase(),
      owner: r.owner,
      balance: fmt(r.balance),
    }));

  // Asset detail
  const assetDetails: AssetDetailRow[] = filteredAssets
    .sort((a, b) => b.value - a.value)
    .map((a) => ({
      name: a.name,
      category: ASSET_CATEGORY_LABELS[a.category],
      value: fmt(a.value),
      owner: a.owner ?? "",
      notes: a.notes ?? "",
    }));

  // Debt detail
  const debtDetails: DebtDetailRow[] = filteredDebts
    .sort((a, b) => b.balance - a.balance)
    .map((d) => ({
      name: d.name,
      category: DEBT_CATEGORY_LABELS[d.category],
      balance: fmt(d.balance),
      rate: fmtPct(d.interestRate),
      minPayment: fmt(d.minimumPayment),
      owner: d.owner ?? "",
    }));

  // Income rows (active only)
  const activeIncomes = filterByOwner(incomes, ownerFilter).filter((i) => i.isActive);
  let incomeTotalMonthlyNum = 0;
  const incomeRows: IncomeRow[] = activeIncomes.map((i) => {
    const mo = toMonthly(i.amount, i.frequency);
    incomeTotalMonthlyNum += mo;
    return {
      name: i.name,
      category: INCOME_CATEGORY_LABELS[i.category],
      owner: i.owner,
      monthly: fmt(mo),
      annual: fmt(mo * 12),
    };
  });

  // Expense categories
  const expCatGroups: Partial<Record<Expense["category"], number>> = {};
  for (const e of filteredExpenses) {
    const mo = toMonthly(e.amount, e.frequency);
    expCatGroups[e.category] = (expCatGroups[e.category] ?? 0) + mo;
  }
  const expenseCategoryRows: ExpenseCategoryRow[] = (
    Object.entries(expCatGroups) as [Expense["category"], number][]
  )
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, mo]) => ({
      category: EXPENSE_CATEGORY_LABELS[cat],
      monthly: fmt(mo),
      pctOfIncome:
        incomeMonthly > 0 ? fmtPct((mo / incomeMonthly) * 100) : "—",
    }));

  return {
    householdName: householdName || "My Household",
    ownerLabel,
    date,
    totalAssets: fmt(assetsTotal),
    totalDebt: fmt(debtTotal),
    netWorth: fmt(netWorthVal),
    netWorthPositive: netWorthVal >= 0,
    assetAllocation,
    debtSummaryRows,
    retirementRows,
    assetDetails,
    debtDetails,
    incomeRows,
    incomeTotalMonthly: fmt(incomeTotalMonthlyNum),
    incomeTotalAnnual: fmt(incomeTotalMonthlyNum * 12),
    expenseCategoryRows,
    totalMonthlyIncome: fmt(incomeMonthly),
    totalMonthlyExpenses: fmt(expenseMonthly),
    monthlyDebtPayments: fmt(debtPayments),
    monthlyCashFlow: fmt(cashFlow),
    cashFlowPositive: cashFlow >= 0,
    savingsRate: fmtPct(savingsRate),
    debtToIncome: fmtPct(dti),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [generating, setGenerating] = useState(false);

  const incomes = useFinanceStore((s) => s.incomes);
  const expenses = useFinanceStore((s) => s.expenses);
  const assets = useFinanceStore((s) => s.assets);
  const debts = useFinanceStore((s) => s.debts);
  const retirementAccounts = useFinanceStore((s) => s.retirementAccounts);
  const householdName = useFinanceStore((s) => s.householdName);
  const ownerFilter = useFinanceStore((s) => s.ownerFilter);

  const today = new Date();
  const dateLabel = formatDateLong(today);
  const ownerLabel = ownerFilter ?? "Full Household";

  // Preview counts (filtered)
  const filteredAssets = filterByOwner(assets, ownerFilter);
  const filteredDebts = filterByOwner(debts, ownerFilter);
  const filteredIncomes = filterByOwner(incomes, ownerFilter).filter((i) => i.isActive);
  const filteredExpenses = filterByOwner(expenses, ownerFilter);
  const filteredRetirement = filterByOwner(retirementAccounts, ownerFilter);

  const retirementTotal = filteredRetirement.reduce((s, a) => s + a.balance, 0);
  const assetsTotal = totalAssets(filteredAssets) + retirementTotal;
  const debtTotal = totalDebt(filteredDebts);
  const netWorthVal = assetsTotal - debtTotal;
  const incomeMonthly = monthlyIncome(filteredIncomes);
  const expenseMonthly = monthlyExpenses(filteredExpenses);

  function handleGeneratePDF() {
    setGenerating(true);
    try {
      const data = buildReportData(
        householdName ?? "My Household",
        ownerFilter,
        incomes,
        expenses,
        assets,
        debts,
        retirementAccounts
      );
      const html = generateReportHTML(data);
      const win = window.open("", "_blank");
      if (!win) {
        alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } finally {
      setGenerating(false);
    }
  }

  const sections = [
    {
      icon: BarChart3,
      title: "Net Worth Summary",
      items: [
        `${filteredAssets.length + filteredRetirement.length} assets totalling ${fmt(assetsTotal)}`,
        `${filteredDebts.length} debts totalling ${fmt(debtTotal)}`,
        `Net worth: ${fmt(netWorthVal)}`,
        "Asset allocation by category",
        filteredRetirement.length > 0
          ? `${filteredRetirement.length} retirement account${filteredRetirement.length !== 1 ? "s" : ""}`
          : null,
      ].filter(Boolean) as string[],
    },
    {
      icon: DollarSign,
      title: "Asset & Debt Detail",
      items: [
        `${filteredAssets.length} asset${filteredAssets.length !== 1 ? "s" : ""} with name, category, value, and owner`,
        filteredRetirement.length > 0
          ? `${filteredRetirement.length} retirement account${filteredRetirement.length !== 1 ? "s" : ""}`
          : null,
        `${filteredDebts.length} debt${filteredDebts.length !== 1 ? "s" : ""} with balance, rate, and minimum payment`,
      ].filter(Boolean) as string[],
    },
    {
      icon: TrendingUp,
      title: "Income & Cash Flow",
      items: [
        `${filteredIncomes.length} active income source${filteredIncomes.length !== 1 ? "s" : ""} — ${fmt(incomeMonthly)}/mo`,
        `Expenses by category — ${fmt(expenseMonthly)}/mo total`,
        "Key financial metrics: cash flow, savings rate, DTI",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Export Report
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Generate a printable PDF financial statement
        </p>
      </div>

      {/* Report info card */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              style={{ background: "var(--accent-blue-dim)" }}
            >
              <FileText size={18} style={{ color: "var(--accent-blue)" }} />
            </span>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {householdName ?? "My Household"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Scope: {ownerLabel}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                As of {dateLabel}
              </p>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
              opacity: generating ? 0.7 : 1,
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            <Download size={15} />
            {generating ? "Preparing…" : "Generate PDF"}
          </button>
        </div>
      </div>

      {/* Section previews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(({ icon: Icon, title, items }) => (
          <div
            key={title}
            className="rounded-xl border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={15} style={{ color: "var(--accent-blue)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </span>
            </div>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: "var(--text-muted)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Tip */}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Tip: To save as PDF, choose &ldquo;Save as PDF&rdquo; as the destination in the print dialog.
        Use the person filter in the sidebar to scope the report to a specific household member.
      </p>
    </div>
  );
}
