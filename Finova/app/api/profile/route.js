import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { buildBudgetPlan } from "@/lib/budget";
import { fromBudgetPlan, fromCategory, toProfile } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: passwordSchema.optional().or(z.literal("")),
  incomePeriod: z.enum(["monthly", "annual"]).optional(),
  incomeAmount: z.coerce.number().positive().optional(),
});

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Enter valid profile details." }, { status: 400 });
  }

  const { name, email, password, incomePeriod, incomeAmount } = parsed.data;
  const hasIncomeUpdate = incomePeriod || incomeAmount !== undefined;
  if (!name && !email && !password && !hasIncomeUpdate) {
    return Response.json({ error: "Change at least one profile setting." }, { status: 400 });
  }

  if (hasIncomeUpdate && (!incomePeriod || incomeAmount === undefined)) {
    return Response.json({ error: "Enter both income period and amount." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (name || hasIncomeUpdate) {
    if (name) {
      const { error } = await supabase
        .from("profiles")
        .update({ name, updated_at: nowIso() })
        .eq("user_id", current.id);
      if (error) return Response.json({ error: error.message }, { status: 400 });
    }

    if (hasIncomeUpdate) {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", current.id)
        .maybeSingle();
      if (profileError) return Response.json({ error: profileError.message }, { status: 400 });
      const profile = toProfile(profileRow);
      if (!profile) return Response.json({ error: "Complete onboarding before editing income." }, { status: 428 });

      const monthlyIncome = Math.round(incomePeriod === "annual" ? incomeAmount / 12 : incomeAmount);
      const { error: incomeError } = await supabase
        .from("incomes")
        .upsert({
          id: id("income"),
          user_id: current.id,
          period: incomePeriod,
          amount: incomeAmount,
          monthly_income: monthlyIncome,
          updated_at: nowIso(),
        }, { onConflict: "user_id" });
      if (incomeError) return Response.json({ error: incomeError.message }, { status: 400 });

      const generated = buildBudgetPlan({
        userId: current.id,
        monthlyIncome,
        hasDebt: profile.hasDebt,
        priority: profile.priority,
        mode: profile.mode,
        birthdate: profile.birthdate,
      });
      for (const table of ["categories", "budget_plans"]) {
        const { error } = await supabase.from(table).delete().eq("user_id", current.id);
        if (error) return Response.json({ error: error.message }, { status: 400 });
      }

      const { error: planError } = await supabase
        .from("budget_plans")
        .upsert(fromBudgetPlan(generated.plan), { onConflict: "user_id" });
      if (planError) return Response.json({ error: planError.message }, { status: 400 });

      const { error: categoryError } = await supabase.from("categories").insert(generated.categories.map(fromCategory));
      if (categoryError) return Response.json({ error: categoryError.message }, { status: 400 });
    }
  }

  if (email || password) {
    const updates = {};
    if (email) updates.email = email.toLowerCase();
    if (password) updates.password = password;
    const { error } = await supabase.auth.updateUser(updates);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({
    message: email
      ? "Profile updated. Confirm the email change from your inbox if Supabase requires it."
      : "Profile updated.",
  });
}

export async function DELETE() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const tables = ["habit_logs", "assistant_conversations", "investment_holdings", "custom_habits", "savings_targets", "goals", "habits", "transactions", "debt_obligations", "categories", "budget_plans", "incomes", "profiles"];
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    const supabase = await createSupabaseServerClient();
    for (const table of tables) {
      const { error: deleteError } = await supabase.from(table).delete().eq("user_id", current.id);
      if (deleteError && !["42P01", "PGRST205"].includes(deleteError.code)) {
        return Response.json({ error: deleteError.message }, { status: 400 });
      }
    }
    await supabase.auth.signOut();
    return Response.json({
      ok: true,
      message: "App data deleted and you were signed out. Set SUPABASE_SERVICE_ROLE_KEY to also delete the Supabase Auth user.",
    });
  }

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", current.id);
    if (error && !["42P01", "PGRST205"].includes(error.code)) return Response.json({ error: error.message }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(current.id);
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true, message: "Account deleted." });
}
