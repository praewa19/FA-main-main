import { differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns";
import { id, nowIso } from "@/lib/store";

export const categoryMeta = {
  essentials: {
    label: "Essential Expenses",
    priority: "High",
    weight: 1.5,
    items: ["Rent / EMI", "Groceries", "Utilities", "Transportation", "Basic healthcare"],
  },
  debt: {
    label: "Debt & Obligations",
    priority: "High",
    weight: 1.5,
    items: ["Credit card dues", "Personal loans", "Home loans", "Education loans"],
  },
  savings: {
    label: "Financial Goals",
    priority: "Medium",
    weight: 1.2,
    items: ["Savings", "Investments", "Emergency fund"],
  },
  lifestyle: {
    label: "Lifestyle / Discretionary",
    priority: "Low",
    weight: 1,
    items: ["Food ordering", "Shopping", "Entertainment", "Subscriptions"],
  },
};

export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function incomeBand(monthlyIncome) {
  if (monthlyIncome < 50000) return "low";
  if (monthlyIncome <= 150000) return "medium";
  return "high";
}

function normalizePercents(percentages) {
  const total = Object.values(percentages).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(percentages).map(([key, value]) => [key, value / total]));
}

export function allocationPercentages({ monthlyIncome, hasDebt, priority = "saving", mode = "professional" }) {
  const band = incomeBand(monthlyIncome);
  let percentages = hasDebt
    ? { essentials: 0.5, debt: 0.2, savings: 0.2, lifestyle: 0.1 }
    : { essentials: 0.5, debt: 0, savings: 0.2, lifestyle: 0.3 };

  if (band === "low") {
    percentages = hasDebt
      ? { essentials: 0.62, debt: 0.18, savings: 0.1, lifestyle: 0.1 }
      : { essentials: 0.66, debt: 0, savings: 0.12, lifestyle: 0.22 };
  }

  if (band === "high") {
    percentages = hasDebt
      ? { essentials: 0.35, debt: 0.15, savings: 0.35, lifestyle: 0.15 }
      : { essentials: 0.36, debt: 0, savings: 0.38, lifestyle: 0.26 };
  }

  if (priority === "saving") {
    percentages.savings += 0.04;
    percentages.lifestyle -= 0.04;
  }

  if (priority === "debt") {
    percentages.debt += hasDebt ? 0.05 : 0;
    percentages.lifestyle -= hasDebt ? 0.05 : 0;
  }

  if (priority === "lifestyle") {
    percentages.lifestyle += 0.04;
    percentages.savings -= 0.04;
  }

  if (mode === "student") {
    percentages.essentials += 0.04;
    percentages.lifestyle -= 0.03;
    percentages.savings -= 0.01;
  }

  if (mode === "family") {
    percentages.essentials += 0.06;
    percentages.savings += 0.02;
    percentages.lifestyle -= 0.08;
  }

  percentages.savings = Math.max(percentages.savings, 0.1);
  percentages.lifestyle = Math.max(percentages.lifestyle, 0.05);
  percentages.debt = hasDebt ? Math.max(percentages.debt, 0.1) : 0;

  return normalizePercents(percentages);
}

export function buildBudgetPlan({ userId, monthlyIncome, hasDebt, priority, mode }) {
  const percentages = allocationPercentages({ monthlyIncome, hasDebt, priority, mode });
  const planId = id("plan");
  const categories = ["essentials", "debt", "savings", "lifestyle"]
    .filter((type) => hasDebt || type !== "debt")
    .map((type) => ({
      id: id("cat"),
      userId,
      planId,
      type,
      label: categoryMeta[type].label,
      priority: categoryMeta[type].priority,
      weight: categoryMeta[type].weight,
      monthlyLimit: Math.round(monthlyIncome * percentages[type]),
      createdAt: nowIso(),
    }));

  return {
    plan: {
      id: planId,
      userId,
      monthlyIncome,
      hasDebt,
      percentages,
      createdAt: nowIso(),
    },
    categories,
  };
}

export function monthProgress(date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const day = differenceInCalendarDays(date, start) + 1;
  const total = differenceInCalendarDays(end, start) + 1;
  return { day, total };
}

export function enrichCategories(categories, transactions, date = new Date()) {
  const { day, total } = monthProgress(date);
  return categories.map((category) => {
    const spent = transactions
      .filter((transaction) => transaction.categoryType === category.type)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const expected = Math.round((day / total) * category.monthlyLimit);
    const remaining = category.monthlyLimit - spent;
    const status = spent > category.monthlyLimit ? "red" : spent > expected ? "orange" : "green";
    const riskScore = expected > 0 ? Number(((spent / expected) * category.weight).toFixed(2)) : 0;

    return {
      ...category,
      spent,
      expected,
      remaining,
      status,
      riskScore,
      progress: category.monthlyLimit > 0 ? Math.min(100, Math.round((spent / category.monthlyLimit) * 100)) : 0,
    };
  });
}

export function budgetAlerts(categories, monthlyIncome) {
  const alerts = [];
  const byType = Object.fromEntries(categories.map((category) => [category.type, category]));
  const essentialsRate = byType.essentials ? byType.essentials.monthlyLimit / monthlyIncome : 0;
  const debtRate = byType.debt ? byType.debt.monthlyLimit / monthlyIncome : 0;
  const savingsRate = byType.savings ? byType.savings.monthlyLimit / monthlyIncome : 0;

  if (essentialsRate > 0.6) alerts.push({ level: "warn", message: `Essentials consume ${Math.round(essentialsRate * 100)}% of income. Keep fixed costs under review.` });
  if (debtRate > 0.4) alerts.push({ level: "risk", message: `Debt consumes ${Math.round(debtRate * 100)}% of income. This is a high repayment risk.` });
  if (savingsRate < 0.1) alerts.push({ level: "warn", message: `Savings are below the 10% minimum target.` });
  return alerts;
}

export function recommendations({ categories, monthlyIncome, mode }) {
  const recs = [];
  const byType = Object.fromEntries(categories.map((category) => [category.type, category]));

  categories
    .filter((category) => category.status !== "green")
    .forEach((category) => {
      const excess = Math.max(0, category.spent - category.expected);
      const remainingDays = Math.max(1, monthProgress().total - monthProgress().day);
      recs.push({
        id: id("rec"),
        severity: category.status === "red" ? "high" : "medium",
        title: `${category.label} is above pace`,
        body: `You are ${money(excess)} above the expected pace. Reduce this category by about ${money(excess / Math.ceil(remainingDays / 7))} per week for the rest of the month.`,
      });
    });

  const idealSavings = Math.round(monthlyIncome * 0.2);
  const currentSavingsLimit = byType.savings?.monthlyLimit || 0;
  const savingsGap = Math.max(0, idealSavings - currentSavingsLimit);
  if (currentSavingsLimit / monthlyIncome < 0.1 || savingsGap > 0) {
    recs.push({
      id: id("rec"),
      severity: "medium",
      title: "Increase savings allocation",
      body: `Your ideal savings target is ${money(idealSavings)}. Move ${money(savingsGap || monthlyIncome * 0.1 - currentSavingsLimit)} from lower-priority spending to reach the assistant target.`,
    });
  }

  const debt = byType.debt;
  if (debt && debt.monthlyLimit / monthlyIncome >= 0.4) {
    recs.push({
      id: id("rec"),
      severity: "high",
      title: "Prioritize debt before lifestyle upgrades",
      body: `Debt is taking ${Math.round((debt.monthlyLimit / monthlyIncome) * 100)}% of income. Freeze new discretionary commitments until this falls below 30%.`,
    });
  }

  if (mode === "student") {
    recs.push({
      id: id("rec"),
      severity: "low",
      title: "Protect a small emergency buffer",
      body: `For student mode, keep at least ${money(monthlyIncome * 0.05)} untouched each month before increasing lifestyle spending.`,
    });
  }

  if (mode === "family") {
    recs.push({
      id: id("rec"),
      severity: "low",
      title: "Raise emergency coverage",
      body: `Family mode should build toward 6 months of essentials. This month, keep ${money((byType.essentials?.monthlyLimit || 0) * 0.1)} reserved for that buffer.`,
    });
  }

  if (recs.length === 0) {
    const lifestyle = byType.lifestyle?.monthlyLimit || 0;
    const savings = byType.savings?.monthlyLimit || 0;
    recs.push({
      id: id("rec"),
      severity: "low",
      title: "Keep the current allocation stable",
      body: `Your budget is on track. Keep lifestyle under ${money(lifestyle)} and protect at least ${money(savings)} for savings this month.`,
    });
  }

  return recs.slice(0, 6);
}

export function financialHealthScore({ categories, habits, monthlyIncome }) {
  const byType = Object.fromEntries(categories.map((category) => [category.type, category]));
  const savingsRate = (byType.savings?.monthlyLimit || 0) / monthlyIncome;
  const debtRate = (byType.debt?.monthlyLimit || 0) / monthlyIncome;
  const redCount = categories.filter((category) => category.status === "red").length;
  const orangeCount = categories.filter((category) => category.status === "orange").length;
  const recentHabits = habits.slice(-30);
  const habitAdherence = recentHabits.length
    ? recentHabits.filter((habit) => habit.budgetAdherence && habit.spendingControl && habit.savingsAction).length / recentHabits.length
    : 0.5;

  const savingsScore = Math.min(100, (savingsRate / 0.2) * 100);
  const debtScore = Math.max(0, 100 - debtRate * 180);
  const spendingScore = Math.max(0, 100 - redCount * 28 - orangeCount * 12);
  const habitsScore = habitAdherence * 100;
  const score = Math.round(savingsScore * 0.3 + debtScore * 0.25 + spendingScore * 0.25 + habitsScore * 0.2);
  const category = score >= 80 ? "Excellent" : score >= 50 ? "Stable" : "Risk";

  return { score, category, components: { savingsScore, debtScore, spendingScore, habitsScore } };
}

export function habitStreak(habits) {
  const sorted = [...habits].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const habit of sorted) {
    if (habit.budgetAdherence && habit.spendingControl && habit.savingsAction) streak += 1;
    else break;
  }
  return streak;
}

export function metalInsights() {
  const metals = [
    { type: "Gold", yesterday: 7110, today: 7184 },
    { type: "Silver", yesterday: 88.4, today: 87.6 },
  ];

  return metals.map((metal) => {
    const change = Number((metal.today - metal.yesterday).toFixed(2));
    const percent = Number(((change / metal.yesterday) * 100).toFixed(2));
    const insight = Math.abs(percent) < 0.15 ? "stable" : change > 0 ? "upward" : "downward";
    return { ...metal, change, percent, insight };
  });
}
