import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Delete household and all cascaded data (income, expenses, assets, debts,
  // retirement_accounts, projects, project_expenses, household_members)
  const { data: household } = await supabase
    .from("households")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (household) {
    const { error: householdErr } = await supabase
      .from("households")
      .delete()
      .eq("id", household.id);

    if (householdErr) {
      console.error("[account/delete] Failed to delete household:", householdErr);
      return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
    }
  }

  // Delete daily message counts (direct FK to auth.users, not household)
  await supabase
    .from("daily_message_counts")
    .delete()
    .eq("user_id", user.id);

  // Delete the auth user — requires service role key
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    console.error("[account/delete] Failed to delete auth user:", deleteErr);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
