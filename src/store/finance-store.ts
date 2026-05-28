import { create } from "zustand";
import type { Income, Expense, Asset, Debt, Project } from "@/types";
import {
  mockIncomes,
  mockExpenses,
  mockAssets,
  mockDebts,
  mockProjects,
} from "@/lib/mock-data";

function uid(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

interface FinanceStore {
  incomes: Income[];
  expenses: Expense[];
  assets: Asset[];
  debts: Debt[];
  projects: Project[];

  addIncome: (item: Omit<Income, "id">) => void;
  updateIncome: (id: string, patch: Partial<Omit<Income, "id">>) => void;
  deleteIncome: (id: string) => void;

  addExpense: (item: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;

  addAsset: (item: Omit<Asset, "id">) => void;
  updateAsset: (id: string, patch: Partial<Omit<Asset, "id">>) => void;
  deleteAsset: (id: string) => void;

  addDebt: (item: Omit<Debt, "id">) => void;
  updateDebt: (id: string, patch: Partial<Omit<Debt, "id">>) => void;
  deleteDebt: (id: string) => void;

  addProject: (item: Omit<Project, "id">) => void;
  updateProject: (id: string, patch: Partial<Omit<Project, "id">>) => void;
  deleteProject: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  incomes: mockIncomes,
  expenses: mockExpenses,
  assets: mockAssets,
  debts: mockDebts,
  projects: mockProjects,

  addIncome: (item) =>
    set((s) => ({ incomes: [...s.incomes, { ...item, id: uid() }] })),
  updateIncome: (id, patch) =>
    set((s) => ({
      incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  deleteIncome: (id) =>
    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) })),

  addExpense: (item) =>
    set((s) => ({ expenses: [...s.expenses, { ...item, id: uid() }] })),
  updateExpense: (id, patch) =>
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  deleteExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

  addAsset: (item) =>
    set((s) => ({ assets: [...s.assets, { ...item, id: uid() }] })),
  updateAsset: (id, patch) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  deleteAsset: (id) =>
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

  addDebt: (item) =>
    set((s) => ({ debts: [...s.debts, { ...item, id: uid() }] })),
  updateDebt: (id, patch) =>
    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })),
  deleteDebt: (id) =>
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

  addProject: (item) =>
    set((s) => ({ projects: [...s.projects, { ...item, id: uid() }] })),
  updateProject: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  deleteProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
}));
