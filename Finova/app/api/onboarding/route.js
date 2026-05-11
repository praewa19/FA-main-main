import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { applyDebtRepaymentTarget, buildBudgetPlan, debtAnalytics } from "@/lib/budget";
import { fromBudgetPlan, fromCategory, fromDebtObligation, fromGoal, fromIncome, fromProfile, fromSavingsTarget } from "@/lib/data";
import { invalidateCachedMarketSnapshot } from "@/lib/market-session-cache";
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
  savingsGoalAmount: z.coerce.number().positive(),
  priority: z.enum(["saving", "debt", "lifestyle"]),
  mode: z.enum(["student", "professional", "family"]),
  hasDebt: z.boolean(),
  debt: debtSchema.optional(),
  goal: z.object({
    name: z.string().min(2).max(80),
    emoji: z.string().min(1).max(8),
    target: z.coerce.number().positive(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
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
    birthdate: parsed.data.birthdate,
  });
  const debtInput = parsed.data.hasDebt && parsed.data.debt ? [{
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
  }] : [];
  const debtTargets = debtAnalytics(debtInput, monthlyIncome);
  const categories = applyDebtRepaymentTarget(generated.categories, debtTargets);

  const supabase = await createSupabaseServerClient();
  invalidateCachedMarketSnapshot(current.id);
  const cleanupTables = [
    "habit_logs",
    "assistant_conversations",
    "transactions",
    "investment_holdings",
    "custom_habits",
    "habits",
    "savings_targets",
    "goals",
    "debt_obligations",
    "categories",
    "budget_plans",
    "incomes",
    "profiles",
  ];
  for (const table of cleanupTables) {
    const { error } = await supabase.from(table).delete().eq("user_id", current.id);
    if (error && !["42P01", "PGRST205"].includes(error.code)) return Response.json({ error: error.message }, { status: 400 });
  }

  const profile = fromProfile({
      id: id("profile"),
      userId: current.id,
      name: parsed.data.name,
      birthdate: parsed.data.birthdate,
      priority: parsed.data.priority,
      mode: parsed.data.mode,
      hasDebt: parsed.data.hasDebt,
      updatedAt: nowIso(),
  });
  const income = fromIncome({
      id: id("income"),
      userId: current.id,
      period: parsed.data.incomePeriod,
      amount: parsed.data.incomeAmount,
      monthlyIncome,
      updatedAt: nowIso(),
  });
  const plan = fromBudgetPlan(generated.plan);
  const upserts = await Promise.all([
    supabase.from("profiles").upsert(profile, { onConflict: "user_id" }),
    supabase.from("incomes").upsert(income, { onConflict: "user_id" }),
    supabase.from("budget_plans").upsert(plan, { onConflict: "user_id" }),
  ]);
  const upsertError = upserts.find((result) => result.error)?.error;
  if (upsertError) return Response.json({ error: upsertError.message }, { status: 400 });

  const { error: categoryError } = await supabase.from("categories").insert(categories.map(fromCategory));
  if (categoryError) return Response.json({ error: categoryError.message }, { status: 400 });

  if (parsed.data.hasDebt && parsed.data.debt) {
    const { error: debtError } = await supabase.from("debt_obligations").insert(fromDebtObligation(debtInput[0]));
    if (debtError) return Response.json({ error: debtError.message }, { status: 400 });
  }

  if (parsed.data.goal) {
    const goal = fromGoal({
      id: id("goal"),
      userId: current.id,
      name: parsed.data.goal.name,
      emoji: parsed.data.goal.emoji,
      target: parsed.data.goal.target,
      current: 0,
      deadline: parsed.data.goal.deadline,
      priority: "high",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const { error: goalError } = await supabase.from("goals").insert(goal);
    if (goalError && !["42P01", "PGRST205"].includes(goalError.code)) return Response.json({ error: goalError.message }, { status: 400 });
  }

  const savingsTarget = fromSavingsTarget({
    id: id("sav"),
    userId: current.id,
    name: parsed.data.incomePeriod === "annual" ? "Annual Savings Goal" : "Monthly Savings Goal",
    target: parsed.data.savingsGoalAmount,
    current: 0,
    monthlyContribution: parsed.data.incomePeriod === "annual"
      ? Math.round(parsed.data.savingsGoalAmount / 12)
      : parsed.data.savingsGoalAmount,
    deadline: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  const { error: savingsError } = await supabase.from("savings_targets").insert(savingsTarget);
  if (savingsError && !["42P01", "PGRST205"].includes(savingsError.code)) return Response.json({ error: savingsError.message }, { status: 400 });

  return Response.json({ user: publicUser({ ...current, onboardingComplete: true }) });
}
