import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
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
      });
      const resetResults = await Promise.all([
        supabase.from("categories").delete().eq("user_id", current.id),
        supabase.from("budget_plans").delete().eq("user_id", current.id),
      ]);
      const resetError = resetResults.find((result) => result.error)?.error;
      if (resetError) return Response.json({ error: resetError.message }, { status: 400 });

      const insertResults = await Promise.all([
        supabase.from("budget_plans").insert(fromBudgetPlan(generated.plan)),
        supabase.from("categories").insert(generated.categories.map(fromCategory)),
      ]);
      const insertError = insertResults.find((result) => result.error)?.error;
      if (insertError) return Response.json({ error: insertError.message }, { status: 400 });
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
