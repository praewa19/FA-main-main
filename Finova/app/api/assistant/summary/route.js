import { getCurrentUser, requireVerified } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  budgetAlerts,
  debtAlerts,
  debtAnalytics,
  debtEmiReminders,
  applyDebtRepaymentTarget,
  enrichCategories,
  financialHealthScore,
  habitStreak,
  metalInsights,
  recommendations,
} from "@/lib/budget";
import { toBudgetPlan, toCategory, toDebtObligation, toHabit, toIncome, toProfile, toTransaction } from "@/lib/data";

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  const [
    { data: profileRow, error: profileError },
    { data: incomeRow, error: incomeError },
    { data: planRow, error: planError },
    { data: categoryRows, error: categoriesError },
    { data: transactionRows, error: transactionsError },
    { data: habitRows, error: habitsError },
    { data: debtRows, error: debtsError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("incomes").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("budget_plans").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", current.id),
    supabase.from("transactions").select("*").eq("user_id", current.id).order("date", { ascending: false }),
    supabase.from("habits").select("*").eq("user_id", current.id).order("date", { ascending: false }),
    supabase.from("debt_obligations").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
  ]);
  const dbError = [profileError, incomeError, planError, categoriesError, transactionsError, habitsError, debtsError].find(Boolean);
  if (dbError) return Response.json({ error: dbError.message }, { status: 400 });

  const profile = toProfile(profileRow);
  const income = toIncome(incomeRow);
  const plan = toBudgetPlan(planRow);
  const categories = (categoryRows || []).map(toCategory);
  const transactions = (transactionRows || []).map(toTransaction);
  const habits = (habitRows || []).map(toHabit);
  const debtObligations = debtAnalytics((debtRows || []).map(toDebtObligation), income?.monthlyIncome || 0);
  const emiReminders = debtEmiReminders(debtObligations);

  if (!profile || !income || !plan) {
    return Response.json({ error: "Onboarding required." }, { status: 428 });
  }

  const adjustedCategories = applyDebtRepaymentTarget(categories, debtObligations);
  const enriched = enrichCategories(adjustedCategories, transactions);
  const ranking = [...enriched].sort((a, b) => b.riskScore - a.riskScore);
  const alerts = [...budgetAlerts(enriched, income.monthlyIncome), ...debtAlerts(debtObligations)];
  const recs = recommendations({ categories: enriched, monthlyIncome: income.monthlyIncome, mode: profile.mode });
  const health = financialHealthScore({ categories: enriched, habits, monthlyIncome: income.monthlyIncome });
  const streak = habitStreak(habits);

  return Response.json({
    profile,
    income,
    plan,
    categories: enriched,
    ranking,
    alerts,
    recommendations: recs,
    health,
    habits,
    transactions,
    debtObligations,
    emiReminders,
    streak,
    metals: metalInsights(),
  });
}
