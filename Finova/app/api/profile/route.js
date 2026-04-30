import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { buildBudgetPlan } from "@/lib/budget";
import { id, nowIso, updateDb } from "@/lib/store";

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

  if (name || hasIncomeUpdate) {
    await updateDb(async (db) => {
      const profile = db.profiles.find((candidate) => candidate.userId === current.id);
      if (profile && name) {
        profile.name = name;
        profile.updatedAt = nowIso();
      }

      if (hasIncomeUpdate) {
        if (!profile) return;
        const monthlyIncome = Math.round(incomePeriod === "annual" ? incomeAmount / 12 : incomeAmount);
        const income = db.incomes.find((candidate) => candidate.userId === current.id);
        if (income) {
          income.period = incomePeriod;
          income.amount = incomeAmount;
          income.monthlyIncome = monthlyIncome;
          income.updatedAt = nowIso();
        } else {
          db.incomes.push({
            id: id("income"),
            userId: current.id,
            period: incomePeriod,
            amount: incomeAmount,
            monthlyIncome,
            updatedAt: nowIso(),
          });
        }

        const generated = buildBudgetPlan({
          userId: current.id,
          monthlyIncome,
          hasDebt: profile.hasDebt,
          priority: profile.priority,
          mode: profile.mode,
        });
        db.budgetPlans = db.budgetPlans.filter((plan) => plan.userId !== current.id);
        db.categories = db.categories.filter((category) => category.userId !== current.id);
        db.budgetPlans.push(generated.plan);
        db.categories.push(...generated.categories);
      }
    });
  }

  if (email || password) {
    const supabase = await createSupabaseServerClient();
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
