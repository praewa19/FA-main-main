import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";

export async function POST() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  const tables = ["debt_obligations", "categories", "budget_plans", "incomes", "profiles"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", current.id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true, message: "Setup reset. Complete onboarding again to rebuild your profile." });
}
