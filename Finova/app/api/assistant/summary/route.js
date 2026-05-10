import { getCurrentUser, requireVerified } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  budgetAlerts,
  debtAlerts,
  debtAnalytics,
  debtEmiReminders,
  applyDebtRepaymentTarget,
  ageFromBirthdate,
  enrichCategories,
  financialHealthScore,
  habitStreak,
  metalInsights,
  recommendations,
  recommendedSavingsRateForAge,
} from "@/lib/budget";
import { toBudgetPlan, toCategory, toCustomHabit, toDebtObligation, toGoal, toHabit, toIncome, toProfile, toSavingsTarget, toTransaction } from "@/lib/data";

function optionalRows(result) {
  if (!result.error) return result.data || [];
  if (["42P01", "PGRST205"].includes(result.error.code)) return [];
  if (result.error.message?.toLowerCase().includes("could not find the table")) return [];
  throw result.error;
}

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
    goalsResult,
    savingsResult,
    customHabitsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("incomes").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("budget_plans").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", current.id),
    supabase.from("transactions").select("*").eq("user_id", current.id).order("date", { ascending: false }),
    supabase.from("habits").select("*").eq("user_id", current.id).order("date", { ascending: false }),
    supabase.from("debt_obligations").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("goals").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("savings_targets").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("custom_habits").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
  ]);
  const dbError = [profileError, incomeError, planError, categoriesError, transactionsError, habitsError, debtsError].find(Boolean);
  if (dbError) return Response.json({ error: dbError.message }, { status: 400 });

  const profile = toProfile(profileRow);
  const income = toIncome(incomeRow);
  const plan = toBudgetPlan(planRow);
  const categories = (categoryRows || []).map(toCategory);
  const transactions = (transactionRows || []).map(toTransaction);
  const habits = (habitRows || []).map(toHabit);
  let goals = [];
  let savingsTargets = [];
  let customHabits = [];
  try {
    goals = optionalRows(goalsResult).map(toGoal);
    savingsTargets = optionalRows(savingsResult).map(toSavingsTarget);
    customHabits = optionalRows(customHabitsResult).map(toCustomHabit);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  const debtObligations = debtAnalytics((debtRows || []).map(toDebtObligation), income?.monthlyIncome || 0);
  const emiReminders = debtEmiReminders(debtObligations);

  if (!profile || !income || !plan) {
    return Response.json({ error: "Onboarding required." }, { status: 428 });
  }

  const hasDebtSignal = profile.hasDebt
    || debtObligations.length > 0
    || transactions.some((transaction) => transaction.categoryType === "debt");
  const visibleCategories = hasDebtSignal
    ? categories
    : categories.filter((category) => category.type !== "debt");
  const adjustedCategories = applyDebtRepaymentTarget(visibleCategories, debtObligations);
  const enriched = enrichCategories(adjustedCategories, transactions);
  const ranking = [...enriched].sort((a, b) => b.riskScore - a.riskScore);
  const alerts = [...budgetAlerts(enriched, income.monthlyIncome), ...debtAlerts(debtObligations)];
  const recs = recommendations({ categories: enriched, monthlyIncome: income.monthlyIncome, mode: profile.mode });
  const health = financialHealthScore({ categories: enriched, habits, monthlyIncome: income.monthlyIncome });
  const streak = habitStreak(habits);
  const credits = transactions.filter((transaction) => transaction.categoryType === "credit");
  const totalCredits = credits.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const expenses = transactions.filter((transaction) => transaction.categoryType !== "credit");
  const totalExpenses = expenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const age = ageFromBirthdate(profile.birthdate);
  const recommendedSavingsRate = recommendedSavingsRateForAge(age);
  const recommendedMonthlySavings = Math.round(income.monthlyIncome * recommendedSavingsRate);

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
    goals,
    savingsTargets,
    customHabits,
    credits,
    totals: {
      totalCredits,
      totalExpenses,
      netBalance: income.monthlyIncome + totalCredits - totalExpenses,
    },
    savingsGuidance: {
      age,
      recommendedSavingsRate,
      recommendedMonthlySavings,
    },
    debtObligations,
    emiReminders,
    streak,
    metals: metalInsights(),
  });
}
