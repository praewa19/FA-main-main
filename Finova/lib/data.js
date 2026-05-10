import { createSupabaseServerClient } from "@/lib/supabase-server";

export function toProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    birthdate: row.birthdate,
    priority: row.priority,
    mode: row.mode,
    hasDebt: row.has_debt,
    updatedAt: row.updated_at,
  };
}

export function fromProfile(profile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    name: profile.name,
    birthdate: profile.birthdate,
    priority: profile.priority,
    mode: profile.mode,
    has_debt: profile.hasDebt,
    updated_at: profile.updatedAt,
  };
}

export function toIncome(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    period: row.period,
    amount: row.amount,
    monthlyIncome: row.monthly_income,
    updatedAt: row.updated_at,
  };
}

export function fromIncome(income) {
  return {
    id: income.id,
    user_id: income.userId,
    period: income.period,
    amount: income.amount,
    monthly_income: income.monthlyIncome,
    updated_at: income.updatedAt,
  };
}

export function toBudgetPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    monthlyIncome: row.monthly_income,
    hasDebt: row.has_debt,
    percentages: row.percentages,
    createdAt: row.created_at,
  };
}

export function fromBudgetPlan(plan) {
  return {
    id: plan.id,
    user_id: plan.userId,
    monthly_income: plan.monthlyIncome,
    has_debt: plan.hasDebt,
    percentages: plan.percentages,
    created_at: plan.createdAt,
  };
}

export function toCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    type: row.type,
    label: row.label,
    priority: row.priority,
    weight: row.weight,
    monthlyLimit: row.monthly_limit,
    createdAt: row.created_at,
  };
}

export function fromCategory(category) {
  return {
    id: category.id,
    user_id: category.userId,
    plan_id: category.planId,
    type: category.type,
    label: category.label,
    priority: category.priority,
    weight: category.weight,
    monthly_limit: category.monthlyLimit,
    created_at: category.createdAt,
  };
}

export function toTransaction(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    categoryType: row.category_type,
    amount: row.amount,
    note: row.note || "",
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromTransaction(transaction) {
  return {
    id: transaction.id,
    user_id: transaction.userId,
    category_type: transaction.categoryType,
    amount: transaction.amount,
    note: transaction.note || "",
    date: transaction.date,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
  };
}

export function toGoal(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    emoji: row.emoji,
    target: row.target,
    current: row.current,
    deadline: row.deadline,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromGoal(goal) {
  return {
    id: goal.id,
    user_id: goal.userId,
    name: goal.name,
    emoji: goal.emoji,
    target: goal.target,
    current: goal.current,
    deadline: goal.deadline,
    priority: goal.priority,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
  };
}

export function toSavingsTarget(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    target: row.target,
    current: row.current,
    monthlyContribution: row.monthly_contribution,
    deadline: row.deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSavingsTarget(target) {
  return {
    id: target.id,
    user_id: target.userId,
    name: target.name,
    target: target.target,
    current: target.current,
    monthly_contribution: target.monthlyContribution,
    deadline: target.deadline,
    created_at: target.createdAt,
    updated_at: target.updatedAt,
  };
}

export function toCustomHabit(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    targetDays: row.target_days,
    completedToday: row.completed_today,
    streak: row.streak,
    bestStreak: row.best_streak,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromCustomHabit(habit) {
  return {
    id: habit.id,
    user_id: habit.userId,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    target_days: habit.targetDays,
    completed_today: habit.completedToday,
    streak: habit.streak,
    best_streak: habit.bestStreak,
    created_at: habit.createdAt,
    updated_at: habit.updatedAt,
  };
}

export function toHabit(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    budgetAdherence: row.budget_adherence,
    spendingControl: row.spending_control,
    savingsAction: row.savings_action,
    createdAt: row.created_at,
  };
}

export function fromHabit(habit) {
  return {
    id: habit.id,
    user_id: habit.userId,
    date: habit.date,
    budget_adherence: habit.budgetAdherence,
    spending_control: habit.spendingControl,
    savings_action: habit.savingsAction,
    created_at: habit.createdAt,
  };
}

export function toDebtObligation(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    originalAmount: row.original_amount,
    annualInterestRate: row.annual_interest_rate,
    remainingMonths: row.remaining_months,
    amountRepaid: row.amount_repaid,
    emiDay: row.emi_day,
    goal: row.goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromDebtObligation(debt) {
  return {
    id: debt.id,
    user_id: debt.userId,
    name: debt.name,
    original_amount: debt.originalAmount,
    annual_interest_rate: debt.annualInterestRate,
    remaining_months: debt.remainingMonths,
    amount_repaid: debt.amountRepaid,
    emi_day: debt.emiDay,
    goal: debt.goal,
    created_at: debt.createdAt,
    updated_at: debt.updatedAt,
  };
}

export async function getSessionData(userId) {
  const supabase = await createSupabaseServerClient();
  const [
    { data: profile, error: profileError },
    { data: income, error: incomeError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("incomes").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileError) throw profileError;
  if (incomeError) throw incomeError;
  return { profile: toProfile(profile), income: toIncome(income) };
}
