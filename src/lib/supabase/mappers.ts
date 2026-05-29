import type { Income, Expense, Asset, Debt, Project, ProjectExpense } from "@/types";

// ── Row types (snake_case from Supabase) ─────────────────────────────────────

export interface IncomeRow {
  id: string; household_id: string; name: string; amount: number;
  frequency: string; category: string; owner: string; is_active: boolean;
  start_date: string | null; notes: string | null;
}
export interface ExpenseRow {
  id: string; household_id: string; name: string; amount: number;
  frequency: string; category: string; is_fixed: boolean;
  is_essential: boolean; notes: string | null;
}
export interface AssetRow {
  id: string; household_id: string; name: string; value: number;
  category: string; appreciation_rate: number | null;
  purchase_price: number | null; purchase_date: string | null; notes: string | null;
}
export interface DebtRow {
  id: string; household_id: string; name: string; balance: number;
  original_balance: number; interest_rate: number; minimum_payment: number;
  category: string; lender: string | null; due_date: string | null; notes: string | null;
}
export interface ProjectRow {
  id: string; household_id: string; name: string; description: string | null;
  total_budget: number; amount_spent: number; category: string; status: string;
  target_date: string | null; notes: string | null;
  project_expenses?: ProjectExpenseRow[];
}
export interface ProjectExpenseRow {
  id: string; project_id: string; name: string; amount: number;
  is_paid: boolean; due_date: string | null;
}

// ── To domain ────────────────────────────────────────────────────────────────

export const toIncome = (r: IncomeRow): Income => ({
  id: r.id, name: r.name, amount: r.amount,
  frequency: r.frequency as Income["frequency"],
  category: r.category as Income["category"],
  owner: r.owner, isActive: r.is_active,
  startDate: r.start_date ?? undefined,
  notes: r.notes ?? undefined,
});

export const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id, name: r.name, amount: r.amount,
  frequency: r.frequency as Expense["frequency"],
  category: r.category as Expense["category"],
  isFixed: r.is_fixed, isEssential: r.is_essential,
  notes: r.notes ?? undefined,
});

export const toAsset = (r: AssetRow): Asset => ({
  id: r.id, name: r.name, value: r.value,
  category: r.category as Asset["category"],
  appreciationRate: r.appreciation_rate ?? undefined,
  purchasePrice: r.purchase_price ?? undefined,
  purchaseDate: r.purchase_date ?? undefined,
  notes: r.notes ?? undefined,
});

export const toDebt = (r: DebtRow): Debt => ({
  id: r.id, name: r.name, balance: r.balance,
  originalBalance: r.original_balance,
  interestRate: r.interest_rate,
  minimumPayment: r.minimum_payment,
  category: r.category as Debt["category"],
  lender: r.lender ?? undefined,
  notes: r.notes ?? undefined,
});

export const toProjectExpense = (r: ProjectExpenseRow): ProjectExpense => ({
  id: r.id, name: r.name, amount: r.amount,
  isPaid: r.is_paid, dueDate: r.due_date ?? undefined,
});

export const toProject = (r: ProjectRow): Project => ({
  id: r.id, name: r.name,
  description: r.description ?? undefined,
  totalBudget: r.total_budget,
  amountSpent: r.amount_spent,
  category: r.category as Project["category"],
  status: r.status as Project["status"],
  targetDate: r.target_date ?? undefined,
  notes: r.notes ?? undefined,
  expenses: (r.project_expenses ?? []).map(toProjectExpense),
});

// ── To row (omit id and household_id — provided separately) ─────────────────

export const fromIncome = (item: Omit<Income, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, amount: item.amount,
  frequency: item.frequency, category: item.category,
  owner: item.owner, is_active: item.isActive,
  start_date: item.startDate ?? null, notes: item.notes ?? null,
});

export const fromExpense = (item: Omit<Expense, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, amount: item.amount,
  frequency: item.frequency, category: item.category,
  is_fixed: item.isFixed, is_essential: item.isEssential,
  notes: item.notes ?? null,
});

export const fromAsset = (item: Omit<Asset, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, value: item.value,
  category: item.category,
  appreciation_rate: item.appreciationRate ?? null,
  purchase_price: item.purchasePrice ?? null,
  purchase_date: item.purchaseDate ?? null,
  notes: item.notes ?? null,
});

export const fromDebt = (item: Omit<Debt, "id">, householdId: string) => ({
  household_id: householdId, name: item.name, balance: item.balance,
  original_balance: item.originalBalance, interest_rate: item.interestRate,
  minimum_payment: item.minimumPayment, category: item.category,
  lender: item.lender ?? null, notes: item.notes ?? null,
});

export const fromProject = (item: Omit<Project, "id" | "expenses">, householdId: string) => ({
  household_id: householdId, name: item.name,
  description: item.description ?? null,
  total_budget: item.totalBudget, amount_spent: item.amountSpent,
  category: item.category, status: item.status,
  target_date: item.targetDate ?? null, notes: item.notes ?? null,
});
