import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Income, Expense, Asset, Debt, Project } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  toIncome, toExpense, toAsset, toDebt, toProject,
  fromIncome, fromExpense, fromAsset, fromDebt, fromProject,
  type IncomeRow, type ExpenseRow, type AssetRow, type DebtRow, type ProjectRow,
} from "@/lib/supabase/mappers";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

interface FinanceStore {
  incomes: Income[];
  expenses: Expense[];
  assets: Asset[];
  debts: Debt[];
  projects: Project[];

  // Auth / sync state
  householdId: string | null;
  householdName: string | null;
  isLoadedFromSupabase: boolean;
  isAuthenticatedUser: boolean;

  loadFromSupabase: (userId: string) => Promise<void>;
  clearSupabaseData: () => void;
  updateHouseholdName: (name: string) => Promise<void>;

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

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
  incomes: [],
  expenses: [],
  assets: [],
  debts: [],
  projects: [],

  householdId: null,
  householdName: null,
  isLoadedFromSupabase: false,
  isAuthenticatedUser: false,

  // ── Load from Supabase ────────────────────────────────────────────────────

  async loadFromSupabase(userId: string) {
    // Clear mock data immediately — authenticated users must never see it
    set({
      isAuthenticatedUser: true,
      incomes: [],
      expenses: [],
      assets: [],
      debts: [],
      projects: [],
    });

    const supabase = createClient();

    // Get or create household
    let { data: household, error: householdErr } = await supabase
      .from("households")
      .select("id, name")
      .eq("user_id", userId)
      .single();

    if (householdErr && householdErr.code !== "PGRST116") {
      console.error("[finance-store] Failed to fetch household:", householdErr);
    }

    if (!household) {
      const { data: created, error: createErr } = await supabase
        .from("households")
        .insert({ user_id: userId, name: "My Household" })
        .select("id, name")
        .single();
      if (createErr) console.error("[finance-store] Failed to create household:", createErr);
      household = created;
    }

    if (!household) return;
    const householdId = household.id;

    const [
      { data: incomeRows, error: incomeErr },
      { data: expenseRows, error: expenseErr },
      { data: assetRows, error: assetErr },
      { data: debtRows, error: debtErr },
      { data: projectRows, error: projectErr },
    ] = await Promise.all([
      supabase.from("incomes").select("*").eq("household_id", householdId),
      supabase.from("expenses").select("*").eq("household_id", householdId),
      supabase.from("assets").select("*").eq("household_id", householdId),
      supabase.from("debts").select("*").eq("household_id", householdId),
      supabase
        .from("projects")
        .select("*, project_expenses(*)")
        .eq("household_id", householdId),
    ]);

    if (incomeErr) console.error("[finance-store] incomes fetch error:", incomeErr);
    if (expenseErr) console.error("[finance-store] expenses fetch error:", expenseErr);
    if (assetErr) console.error("[finance-store] assets fetch error:", assetErr);
    if (debtErr) console.error("[finance-store] debts fetch error:", debtErr);
    if (projectErr) console.error("[finance-store] projects fetch error:", projectErr);

    set({
      householdId,
      householdName: (household as { id: string; name?: string }).name ?? null,
      isLoadedFromSupabase: true,
      incomes: incomeErr ? [] : (incomeRows as IncomeRow[]).map(toIncome),
      expenses: expenseErr ? [] : (expenseRows as ExpenseRow[]).map(toExpense),
      assets: assetErr ? [] : (assetRows as AssetRow[]).map(toAsset),
      debts: debtErr ? [] : (debtRows as DebtRow[]).map(toDebt),
      projects: projectErr ? [] : (projectRows as ProjectRow[]).map(toProject),
    });
  },

  async updateHouseholdName(name: string) {
    set({ householdName: name });
    const { householdId } = get();
    if (householdId) {
      const { error } = await createClient().from("households").update({ name }).eq("id", householdId);
      if (error) console.error("[finance-store] Failed to update household name:", error);
    }
  },

  clearSupabaseData() {
    set({
      householdId: null,
      householdName: null,
      isLoadedFromSupabase: false,
      isAuthenticatedUser: false,
      incomes: [],
      expenses: [],
      assets: [],
      debts: [],
      projects: [],
    });
  },

  // ── Income ────────────────────────────────────────────────────────────────

  addIncome(item) {
    const id = uid();
    set((s) => ({ incomes: [...s.incomes, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("incomes").insert({ id, ...fromIncome(item, householdId) }).then();
    }
  },

  updateIncome(id, patch) {
    set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().incomes.find((i) => i.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("incomes").update(fromIncome(rest, householdId)).eq("id", id).then();
      }
    }
  },

  deleteIncome(id) {
    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }));
    if (get().householdId) {
      createClient().from("incomes").delete().eq("id", id).then();
    }
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  addExpense(item) {
    const id = uid();
    set((s) => ({ expenses: [...s.expenses, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("expenses").insert({ id, ...fromExpense(item, householdId) }).then();
    }
  },

  updateExpense(id, patch) {
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().expenses.find((e) => e.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("expenses").update(fromExpense(rest, householdId)).eq("id", id).then();
      }
    }
  },

  deleteExpense(id) {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    if (get().householdId) {
      createClient().from("expenses").delete().eq("id", id).then();
    }
  },

  // ── Assets ────────────────────────────────────────────────────────────────

  addAsset(item) {
    const id = uid();
    set((s) => ({ assets: [...s.assets, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("assets").insert({ id, ...fromAsset(item, householdId) }).then();
    }
  },

  updateAsset(id, patch) {
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().assets.find((a) => a.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("assets").update(fromAsset(rest, householdId)).eq("id", id).then();
      }
    }
  },

  deleteAsset(id) {
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    if (get().householdId) {
      createClient().from("assets").delete().eq("id", id).then();
    }
  },

  // ── Debts ─────────────────────────────────────────────────────────────────

  addDebt(item) {
    const id = uid();
    set((s) => ({ debts: [...s.debts, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("debts").insert({ id, ...fromDebt(item, householdId) }).then();
    }
  },

  updateDebt(id, patch) {
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().debts.find((d) => d.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("debts").update(fromDebt(rest, householdId)).eq("id", id).then();
      }
    }
  },

  deleteDebt(id) {
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
    if (get().householdId) {
      createClient().from("debts").delete().eq("id", id).then();
    }
  },

  // ── Projects ──────────────────────────────────────────────────────────────

  addProject(item) {
    const id = uid();
    set((s) => ({ projects: [...s.projects, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      const { expenses: projectExpenses, ...rest } = item;
      createClient().from("projects").insert({ id, ...fromProject(rest, householdId) }).then();
    }
  },

  updateProject(id, patch) {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().projects.find((p) => p.id === id);
      if (updated) {
        const { id: _id, expenses: _exp, ...rest } = updated;
        createClient().from("projects").update(fromProject(rest, householdId)).eq("id", id).then();
      }
    }
  },

  deleteProject(id) {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    if (get().householdId) {
      createClient().from("projects").delete().eq("id", id).then();
    }
  },
    }),
    {
      name: "family-ledger-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        incomes: state.incomes,
        expenses: state.expenses,
        assets: state.assets,
        debts: state.debts,
        projects: state.projects,
        householdId: state.householdId,
        householdName: state.householdName,
      }),
    }
  )
);
