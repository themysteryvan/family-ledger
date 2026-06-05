import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Income, Expense, Asset, Debt, Project, RetirementAccount } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  toIncome, toExpense, toAsset, toDebt, toProject, toRetirementAccount,
  fromIncome, fromExpense, fromAsset, fromDebt, fromProject, fromRetirementAccount,
  type IncomeRow, type ExpenseRow, type AssetRow, type DebtRow, type ProjectRow,
  type RetirementAccountRow,
} from "@/lib/supabase/mappers";
import {
  mockIncomes, mockExpenses, mockAssets, mockDebts, mockProjects, mockRetirementAccounts,
} from "@/lib/mock-data";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

// ── One-time migration: push existing localStorage data into Supabase ─────────
// Runs once per device after first successful login. Uses upsert so re-running
// is safe. Sets 'family-ledger-migrated' flag to prevent future runs.

interface MigrableState {
  incomes: Income[]; expenses: Expense[]; assets: Asset[];
  debts: Debt[]; retirementAccounts: RetirementAccount[]; projects: Project[];
}

async function migrateLocalDataToSupabase(householdId: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("family-ledger-migrated") === "true") return;
  } catch { return; }

  console.log("[finance-store] Starting migration...");

  // Read directly from localStorage — Zustand may not be rehydrated yet when
  // this runs, so we cannot rely on get() returning the persisted data.
  let state: MigrableState = { incomes: [], expenses: [], assets: [], debts: [], retirementAccounts: [], projects: [] };
  try {
    const raw = localStorage.getItem("family-ledger-store");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<MigrableState> };
      const s = parsed.state ?? {};
      state = {
        incomes: s.incomes ?? [],
        expenses: s.expenses ?? [],
        assets: s.assets ?? [],
        debts: s.debts ?? [],
        retirementAccounts: s.retirementAccounts ?? [],
        projects: s.projects ?? [],
      };
    }
  } catch (err) {
    console.error("[finance-store] Could not read localStorage for migration:", err);
    return;
  }

  const hasData = state.incomes.length > 0 || state.expenses.length > 0 ||
    state.assets.length > 0 || state.debts.length > 0 ||
    state.retirementAccounts.length > 0;

  if (!hasData) {
    try { localStorage.setItem("family-ledger-migrated", "true"); } catch {}
    return;
  }

  const supabase = createClient();
  try {
    // .then(() => null) converts each PromiseLike builder into a real Promise
    const ops = [
      state.incomes.length > 0
        ? supabase.from("income").upsert(
            state.incomes.map(({ id, ...r }) => ({ id, ...fromIncome(r, householdId) }))
          ).then(() => null)
        : null,
      state.expenses.length > 0
        ? supabase.from("expenses").upsert(
            state.expenses.map(({ id, ...r }) => ({ id, ...fromExpense(r, householdId) }))
          ).then(() => null)
        : null,
      state.assets.length > 0
        ? supabase.from("assets").upsert(
            state.assets.map(({ id, ...r }) => ({ id, ...fromAsset(r, householdId) }))
          ).then(() => null)
        : null,
      state.debts.length > 0
        ? supabase.from("debts").upsert(
            state.debts.map(({ id, ...r }) => ({ id, ...fromDebt(r, householdId) }))
          ).then(() => null)
        : null,
      state.retirementAccounts.length > 0
        ? supabase.from("retirement_accounts").upsert(
            state.retirementAccounts.map(({ id, ...r }) => ({ id, ...fromRetirementAccount(r, householdId) }))
          ).then(() => null)
        : null,
      state.projects.length > 0
        ? supabase.from("projects").upsert(
            state.projects.map(({ id, expenses: _exp, ...r }) => ({ id, ...fromProject(r, householdId) }))
          ).then(() => null)
        : null,
    ].filter(Boolean);

    await Promise.all(ops);
    try { localStorage.setItem("family-ledger-migrated", "true"); } catch {}
    console.log("[finance-store] Migration to Supabase complete");
  } catch (err) {
    console.error("[finance-store] Migration failed (will retry next login):", err);
  }
}

// ── Store interface ───────────────────────────────────────────────────────────

interface FinanceStore {
  incomes: Income[];
  expenses: Expense[];
  assets: Asset[];
  debts: Debt[];
  projects: Project[];
  retirementAccounts: RetirementAccount[];

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

  addRetirementAccount: (item: Omit<RetirementAccount, "id">) => void;
  updateRetirementAccount: (id: string, patch: Partial<Omit<RetirementAccount, "id">>) => void;
  deleteRetirementAccount: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
  incomes: mockIncomes,
  expenses: mockExpenses,
  assets: mockAssets,
  debts: mockDebts,
  projects: mockProjects,
  retirementAccounts: mockRetirementAccounts,

  householdId: null,
  householdName: null,
  isLoadedFromSupabase: false,
  isAuthenticatedUser: false,

  // ── Load from Supabase ────────────────────────────────────────────────────

  async loadFromSupabase(userId: string) {
    set({ isAuthenticatedUser: true });

    const supabase = createClient();

    // 1. Get or create household (owner_id is the correct column)
    let { data: household, error: householdErr } = await supabase
      .from("households")
      .select("id, name")
      .eq("owner_id", userId)
      .single();

    if (householdErr && householdErr.code !== "PGRST116") {
      console.error("[finance-store] Failed to fetch household:", householdErr);
    }

    if (!household) {
      const { data: created, error: createErr } = await supabase
        .from("households")
        .insert({ owner_id: userId, name: "My Household" })
        .select("id, name")
        .single();
      if (createErr) console.error("[finance-store] Failed to create household:", createErr);
      household = created;
    }

    // If household unavailable, leave existing localStorage state intact
    if (!household) return;
    const householdId = household.id;

    // 2. Expose householdId immediately so any in-flight writes get the right id
    set({
      householdId,
      householdName: (household as { id: string; name?: string }).name ?? null,
    });

    // 3. One-time migration: push existing localStorage data into Supabase
    await migrateLocalDataToSupabase(householdId);

    // 4. Snapshot existing state — used as fallback if individual table fetches fail
    const existing = get();

    // 5. Fetch all 6 tables in parallel
    const [
      { data: incomeRows,     error: incomeErr },
      { data: expenseRows,    error: expenseErr },
      { data: assetRows,      error: assetErr },
      { data: debtRows,       error: debtErr },
      { data: projectRows,    error: projectErr },
      { data: retirementRows, error: retirementErr },
    ] = await Promise.all([
      supabase.from("income").select("*").eq("household_id", householdId),
      supabase.from("expenses").select("*").eq("household_id", householdId),
      supabase.from("assets").select("*").eq("household_id", householdId),
      supabase.from("debts").select("*").eq("household_id", householdId),
      supabase.from("projects").select("*").eq("household_id", householdId),
      supabase.from("retirement_accounts").select("*").eq("household_id", householdId),
    ]);

    if (incomeErr)     console.error("[finance-store] incomes fetch error:", incomeErr);
    if (expenseErr)    console.error("[finance-store] expenses fetch error:", expenseErr);
    if (assetErr)      console.error("[finance-store] assets fetch error:", assetErr);
    if (debtErr)       console.error("[finance-store] debts fetch error:", debtErr);
    if (projectErr)    console.error("[finance-store] projects fetch error:", projectErr);
    if (retirementErr) console.error("[finance-store] retirement_accounts fetch error:", retirementErr);

    // 6. Overwrite store with Supabase truth — fall back to existing data on error
    set({
      isLoadedFromSupabase: true,
      incomes:            incomeErr     ? existing.incomes            : (incomeRows     as IncomeRow[]).map(toIncome),
      expenses:           expenseErr    ? existing.expenses           : (expenseRows    as ExpenseRow[]).map(toExpense),
      assets:             assetErr      ? existing.assets             : (assetRows      as AssetRow[]).map(toAsset),
      debts:              debtErr       ? existing.debts              : (debtRows       as DebtRow[]).map(toDebt),
      projects:           projectErr    ? existing.projects           : (projectRows    as ProjectRow[]).map(toProject),
      retirementAccounts: retirementErr ? existing.retirementAccounts : (retirementRows as RetirementAccountRow[]).map(toRetirementAccount),
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
      incomes: mockIncomes,
      expenses: mockExpenses,
      assets: mockAssets,
      debts: mockDebts,
      projects: mockProjects,
      retirementAccounts: mockRetirementAccounts,
    });
  },

  // ── Income ────────────────────────────────────────────────────────────────

  addIncome(item) {
    const id = uid();
    set((s) => ({ incomes: [...s.incomes, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("income").insert({ id, ...fromIncome(item, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert income:", error);
      });
    }
  },

  updateIncome(id, patch) {
    set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().incomes.find((i) => i.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("income").update(fromIncome(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update income:", error);
        });
      }
    }
  },

  deleteIncome(id) {
    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }));
    if (get().householdId) {
      createClient().from("income").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete income:", error);
      });
    }
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  addExpense(item) {
    const id = uid();
    set((s) => ({ expenses: [...s.expenses, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("expenses").insert({ id, ...fromExpense(item, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert expense:", error);
      });
    }
  },

  updateExpense(id, patch) {
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().expenses.find((e) => e.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("expenses").update(fromExpense(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update expense:", error);
        });
      }
    }
  },

  deleteExpense(id) {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    if (get().householdId) {
      createClient().from("expenses").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete expense:", error);
      });
    }
  },

  // ── Assets ────────────────────────────────────────────────────────────────

  addAsset(item) {
    const id = uid();
    set((s) => ({ assets: [...s.assets, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("assets").insert({ id, ...fromAsset(item, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert asset:", error);
      });
    }
  },

  updateAsset(id, patch) {
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().assets.find((a) => a.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("assets").update(fromAsset(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update asset:", error);
        });
      }
    }
  },

  deleteAsset(id) {
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    if (get().householdId) {
      createClient().from("assets").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete asset:", error);
      });
    }
  },

  // ── Debts ─────────────────────────────────────────────────────────────────

  addDebt(item) {
    const id = uid();
    set((s) => ({ debts: [...s.debts, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("debts").insert({ id, ...fromDebt(item, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert debt:", error);
      });
    }
  },

  updateDebt(id, patch) {
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().debts.find((d) => d.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("debts").update(fromDebt(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update debt:", error);
        });
      }
    }
  },

  deleteDebt(id) {
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }));
    if (get().householdId) {
      createClient().from("debts").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete debt:", error);
      });
    }
  },

  // ── Projects ──────────────────────────────────────────────────────────────

  addProject(item) {
    const id = uid();
    set((s) => ({ projects: [...s.projects, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      const { expenses: _exp, ...rest } = item;
      createClient().from("projects").insert({ id, ...fromProject(rest, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert project:", error);
      });
    }
  },

  updateProject(id, patch) {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().projects.find((p) => p.id === id);
      if (updated) {
        const { id: _id, expenses: _exp, ...rest } = updated;
        createClient().from("projects").update(fromProject(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update project:", error);
        });
      }
    }
  },

  deleteProject(id) {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    if (get().householdId) {
      createClient().from("projects").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete project:", error);
      });
    }
  },

  // ── Retirement Accounts ───────────────────────────────────────────────────

  addRetirementAccount(item) {
    const id = uid();
    set((s) => ({ retirementAccounts: [...s.retirementAccounts, { ...item, id }] }));
    const { householdId } = get();
    if (householdId) {
      createClient().from("retirement_accounts").insert({ id, ...fromRetirementAccount(item, householdId) }).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to insert retirement account:", error);
      });
    }
  },

  updateRetirementAccount(id, patch) {
    set((s) => ({
      retirementAccounts: s.retirementAccounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    const { householdId } = get();
    if (householdId) {
      const updated = get().retirementAccounts.find((a) => a.id === id);
      if (updated) {
        const { id: _id, ...rest } = updated;
        createClient().from("retirement_accounts").update(fromRetirementAccount(rest, householdId)).eq("id", id).then(({ error }) => {
          if (error) console.error("[finance-store] Failed to update retirement account:", error);
        });
      }
    }
  },

  deleteRetirementAccount(id) {
    set((s) => ({ retirementAccounts: s.retirementAccounts.filter((a) => a.id !== id) }));
    if (get().householdId) {
      createClient().from("retirement_accounts").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[finance-store] Failed to delete retirement account:", error);
      });
    }
  },
    }),
    {
      name: "family-ledger-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return undefined as unknown as Storage;
        return localStorage;
      }),
      skipHydration: true,
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const s = persistedState as Record<string, unknown>;
        function backfill(arr: unknown[]): unknown[] {
          return arr.map((item) => {
            const r = item as Record<string, unknown>;
            return r.dataSource ? r : { ...r, dataSource: "Manual Entry" };
          });
        }
        if (version === 0) {
          return {
            ...s,
            incomes: backfill((s.incomes as unknown[] | undefined) ?? []),
            expenses: backfill((s.expenses as unknown[] | undefined) ?? []),
            assets: backfill((s.assets as unknown[] | undefined) ?? []),
            debts: backfill((s.debts as unknown[] | undefined) ?? []),
            retirementAccounts: backfill((s.retirementAccounts as unknown[] | undefined) ?? []),
          };
        }
        // v1→v2: If this is a demo user (no householdId) with no data, restore mock data
        if (version < 2 && !s.householdId) {
          const hasData =
            ((s.incomes as unknown[])?.length ?? 0) > 0 ||
            ((s.expenses as unknown[])?.length ?? 0) > 0 ||
            ((s.assets as unknown[])?.length ?? 0) > 0;
          if (!hasData) {
            return {
              ...s,
              incomes: mockIncomes,
              expenses: mockExpenses,
              assets: mockAssets,
              debts: mockDebts,
              projects: mockProjects,
              retirementAccounts: mockRetirementAccounts,
            };
          }
        }
        return s;
      },
      partialize: (state) => ({
        incomes: state.incomes,
        expenses: state.expenses,
        assets: state.assets,
        debts: state.debts,
        projects: state.projects,
        retirementAccounts: state.retirementAccounts,
        householdId: state.householdId,
        householdName: state.householdName,
      }),
    }
  )
);
