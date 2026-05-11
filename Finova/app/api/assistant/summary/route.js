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
import { fetchAllRows, toBudgetPlan, toCategory, toCustomHabit, toDebtObligation, toGoal, toHabit, toHabitLog, toIncome, toProfile, toSavingsTarget, toTransaction } from "@/lib/data";
import { computeHabitMetrics } from "@/lib/habits";

function optionalRows(result) {
  if (!result.error) return result.data || [];
  if (["42P01", "PGRST205"].includes(result.error.code)) return [];
  if (result.error.message?.toLowerCase().includes("could not find the table")) return [];
  throw result.error;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).format(date);
}

function buildMonthSeries(transactions, today = new Date()) {
  const transactionMonths = transactions
    .map((transaction) => String(transaction.date || "").slice(0, 7))
    .filter((key) => /^\d{4}-\d{2}$/.test(key))
    .sort();
  const earliestKey = transactionMonths[0];
  const minimumStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const earliestDate = earliestKey ? new Date(`${earliestKey}-01T12:00:00+05:30`) : null;
  const startDate = earliestDate && earliestDate < minimumStart ? earliestDate : minimumStart;
  const endDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const months = [];
  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setMonth(cursor.getMonth() + 1)) {
    const date = new Date(cursor);
    months.push({
      key: monthKey(date),
      label: monthLabel(date),
      expenses: 0,
      savings: 0,
      credits: 0,
      goals: 0,
    });
  }
  const byKey = new Map(months.map((month) => [month.key, month]));
  transactions.forEach((transaction) => {
    const key = String(transaction.date || "").slice(0, 7);
    const bucket = byKey.get(key);
    if (!bucket) return;
    const amount = Number(transaction.amount || 0);
    if (transaction.categoryType === "credit") {
      bucket.credits += amount;
      return;
    }
    if (transaction.goalId || String(transaction.categoryType || "").startsWith("goal:")) {
      bucket.goals += amount;
    }
    if (transaction.categoryType === "savings" || transaction.goalId || String(transaction.categoryType || "").startsWith("goal:")) {
      bucket.savings += amount;
    }
    bucket.expenses += amount;
  });
  return months;
}

function buildTopSpendDate(transactions) {
  const totals = transactions
    .filter((transaction) => transaction.categoryType !== "credit")
    .reduce((acc, transaction) => {
      const key = String(transaction.date || "");
      if (!key) return acc;
      acc.set(key, (acc.get(key) || 0) + Number(transaction.amount || 0));
      return acc;
    }, new Map());
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return { date: top[0], spending: top[1] };
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
    transactionRowsResult,
    { data: habitRows, error: habitsError },
    { data: debtRows, error: debtsError },
    goalsResult,
    savingsResult,
    customHabitsResult,
    habitLogsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("incomes").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("budget_plans").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", current.id),
    fetchAllRows(() => supabase
      .from("transactions")
      .select("*")
      .eq("user_id", current.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })),
    supabase.from("habits").select("*").eq("user_id", current.id).order("date", { ascending: false }),
    supabase.from("debt_obligations").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("goals").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("savings_targets").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("custom_habits").select("*").eq("user_id", current.id).order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("*").eq("user_id", current.id).order("log_date", { ascending: true }),
  ]);
  const dbError = [profileError, incomeError, planError, categoriesError, habitsError, debtsError].find(Boolean);
  if (dbError) return Response.json({ error: dbError.message }, { status: 400 });

  const profile = toProfile(profileRow);
  const income = toIncome(incomeRow);
  const plan = toBudgetPlan(planRow);
  const categories = (categoryRows || []).map(toCategory);
  const transactions = (transactionRowsResult || []).map(toTransaction);
  const habits = (habitRows || []).map(toHabit);
  let goals = [];
  let savingsTargets = [];
  let customHabits = [];
  let habitLogs = [];
  try {
    goals = optionalRows(goalsResult).map(toGoal);
    savingsTargets = optionalRows(savingsResult).map(toSavingsTarget);
    customHabits = optionalRows(customHabitsResult).map(toCustomHabit);
    habitLogs = optionalRows(habitLogsResult).map(toHabitLog);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  const logsByHabit = new Map();
  habitLogs.forEach((log) => {
    if (!logsByHabit.has(log.habitId)) logsByHabit.set(log.habitId, []);
    logsByHabit.get(log.habitId).push(log);
  });
  customHabits = customHabits.map((habit) => computeHabitMetrics(habit, logsByHabit.get(habit.id) || []));
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
  const monthSeries = buildMonthSeries(transactions);
  const healthTrend = monthSeries.map((month, index) => {
    const monthDate = new Date(`${month.key}-01T12:00:00+05:30`);
    const monthTransactions = transactions.filter((transaction) => String(transaction.date || "").slice(0, 7) === month.key);
    const monthHabits = habits.filter((habit) => String(habit.date || "").slice(0, 7) === month.key);
    const monthCategories = enrichCategories(adjustedCategories, monthTransactions, monthDate);
    const monthHealth = financialHealthScore({ categories: monthCategories, habits: monthHabits, monthlyIncome: income.monthlyIncome });
    return {
      key: month.key,
      label: month.label,
      score: index === monthSeries.length - 1 ? health.score : monthHealth.score,
    };
  });
  const topSpendDate = buildTopSpendDate(transactions);
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
    analytics: {
      monthSeries,
      healthTrend,
      topSpendDate,
    },
    metals: metalInsights(),
  });
}
