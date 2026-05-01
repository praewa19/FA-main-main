import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { buildBudgetPlan } from "@/lib/budget";
import { fromBudgetPlan, fromCategory, fromDebtObligation, fromIncome, fromProfile } from "@/lib/data";
import { id, nowIso, publicUser } from "@/lib/store";

const debtSchema = z.object({
  name: z.string().min(2).max(80),
  originalAmount: z.coerce.number().positive(),
  annualInterestRate: z.coerce.number().min(0),
  remainingMonths: z.coerce.number().int().positive(),
  amountRepaid: z.coerce.number().min(0),
  emiDay: z.coerce.number().int().min(1).max(31),
  goal: z.enum(["catch_up", "stay_consistent", "pay_ahead"]),
}).refine((data) => data.amountRepaid <= data.originalAmount, {
  message: "Amount repaid cannot be greater than the debt amount.",
  path: ["amountRepaid"],
});

const schema = z.object({
  name: z.string().min(2),
  birthdate: z.string().min(8),
  incomePeriod: z.enum(["monthly", "annual"]),
  incomeAmount: z.coerce.number().positive(),
  priority: z.enum(["saving", "debt", "lifestyle"]),
  mode: z.enum(["student", "professional", "family"]),
  hasDebt: z.boolean(),
  debt: debtSchema.optional(),
}).refine((data) => !data.hasDebt || data.debt, {
  message: "Complete debt details when debt obligations are enabled.",
  path: ["debt"],
});

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Complete all onboarding fields." }, { status: 400 });

  const monthlyIncome = Math.round(parsed.data.incomePeriod === "annual" ? parsed.data.incomeAmount / 12 : parsed.data.incomeAmount);
  const generated = buildBudgetPlan({
    userId: current.id,
    monthlyIncome,
    hasDebt: parsed.data.hasDebt,
    priority: parsed.data.priority,
    mode: parsed.data.mode,
  });

  const supabase = await createSupabaseServerClient();
  const deleteError = await Promise.all([
    supabase.from("debt_obligations").delete().eq("user_id", current.id),
    supabase.from("categories").delete().eq("user_id", current.id),
    supabase.from("budget_plans").delete().eq("user_id", current.id),
    supabase.from("incomes").delete().eq("user_id", current.id),
    supabase.from("profiles").delete().eq("user_id", current.id),
  ]).then((results) => results.find((result) => result.error)?.error);

  if (deleteError) return Response.json({ error: deleteError.message }, { status: 400 });

  const insertOps = [
    supabase.from("profiles").insert(fromProfile({
      id: id("profile"),
      userId: current.id,
      name: parsed.data.name,
      birthdate: parsed.data.birthdate,
      priority: parsed.data.priority,
      mode: parsed.data.mode,
      hasDebt: parsed.data.hasDebt,
      updatedAt: nowIso(),
    })),
    supabase.from("incomes").insert(fromIncome({
      id: id("income"),
      userId: current.id,
      period: parsed.data.incomePeriod,
      amount: parsed.data.incomeAmount,
      monthlyIncome,
      updatedAt: nowIso(),
    })),
    supabase.from("budget_plans").insert(fromBudgetPlan(generated.plan)),
    supabase.from("categories").insert(generated.categories.map(fromCategory)),
  ];
  if (parsed.data.hasDebt && parsed.data.debt) {
    insertOps.push(supabase.from("debt_obligations").insert(fromDebtObligation({
      id: id("debt"),
      userId: current.id,
      name: parsed.data.debt.name,
      originalAmount: parsed.data.debt.originalAmount,
      annualInterestRate: parsed.data.debt.annualInterestRate,
      remainingMonths: parsed.data.debt.remainingMonths,
      amountRepaid: parsed.data.debt.amountRepaid,
      emiDay: parsed.data.debt.emiDay,
      goal: parsed.data.debt.goal,
      createdAt: nowIso(),
    })));
  }

  const inserts = await Promise.all(insertOps);
  const insertError = inserts.find((result) => result.error)?.error;
  if (insertError) return Response.json({ error: insertError.message }, { status: 400 });

  return Response.json({ user: publicUser({ ...current, onboardingComplete: true }) });
}
