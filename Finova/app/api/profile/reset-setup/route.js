import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";

export async function POST() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  const results = await Promise.all([
    supabase.from("debt_obligations").delete().eq("user_id", current.id),
    supabase.from("categories").delete().eq("user_id", current.id),
    supabase.from("budget_plans").delete().eq("user_id", current.id),
    supabase.from("incomes").delete().eq("user_id", current.id),
    supabase.from("profiles").delete().eq("user_id", current.id),
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ ok: true, message: "Setup reset. Complete onboarding again to rebuild your profile." });
}
