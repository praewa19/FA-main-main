import { getCurrentUser, requireVerified } from "@/lib/auth";
import {
  budgetAlerts,
  enrichCategories,
  financialHealthScore,
  habitStreak,
  metalInsights,
  recommendations,
} from "@/lib/budget";
import { readDb } from "@/lib/store";

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const db = await readDb();
  const profile = db.profiles.find((candidate) => candidate.userId === current.id);
  const income = db.incomes.find((candidate) => candidate.userId === current.id);
  const plan = db.budgetPlans.find((candidate) => candidate.userId === current.id);
  const categories = db.categories.filter((category) => category.userId === current.id);
  const transactions = db.transactions.filter((transaction) => transaction.userId === current.id);
  const habits = db.habits.filter((habit) => habit.userId === current.id);

  if (!profile || !income || !plan) {
    return Response.json({ error: "Onboarding required." }, { status: 428 });
  }

  const enriched = enrichCategories(categories, transactions);
  const ranking = [...enriched].sort((a, b) => b.riskScore - a.riskScore);
  const alerts = budgetAlerts(enriched, income.monthlyIncome);
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
    streak,
    metals: metalInsights(),
  });
}
