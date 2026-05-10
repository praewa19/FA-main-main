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
    label: "Savings",
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
  credit: {
    label: "Credit",
    priority: "Income",
    weight: 0,
    items: ["Salary", "Refunds", "Cashback", "Bonuses"],
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

export function allocationPercentages({ monthlyIncome, hasDebt, priority = "saving", mode = "professional", age = null }) {
  const band = incomeBand(monthlyIncome);
  const targetSavings = recommendedSavingsRateForAge(age);
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

  percentages.savings = Math.max(percentages.savings, targetSavings);
  percentages.lifestyle = Math.max(percentages.lifestyle, 0.05);
  percentages.debt = hasDebt ? Math.max(percentages.debt, 0.1) : 0;

  return normalizePercents(percentages);
}

export function ageFromBirthdate(birthdate, today = new Date()) {
  if (!birthdate) return null;
  const born = new Date(`${birthdate}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  let age = today.getFullYear() - born.getFullYear();
  const hasHadBirthday = today.getMonth() > born.getMonth()
    || (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

export function recommendedSavingsRateForAge(age) {
  if (!Number.isFinite(age)) return 0.2;
  if (age < 25) return 0.15;
  if (age < 35) return 0.2;
  if (age < 45) return 0.22;
  if (age < 55) return 0.25;
  if (age < 65) return 0.22;
  return 0.18;
}

export function buildBudgetPlan({ userId, monthlyIncome, hasDebt, priority, mode, birthdate }) {
  const age = ageFromBirthdate(birthdate);
  const percentages = allocationPercentages({ monthlyIncome, hasDebt, priority, mode, age });
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

export function applyDebtRepaymentTarget(categories, debts = []) {
  const totalEmi = debts.reduce((sum, debt) => sum + Number(debt.estimatedEmi || 0), 0);
  if (totalEmi <= 0) return categories;
  return categories.map((category) => (
    category.type === "debt"
      ? { ...category, monthlyLimit: Math.round(totalEmi) }
      : category
  ));
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
    const actual = transactions
      .filter((transaction) => transaction.categoryType !== "credit")
      .filter((transaction) => transaction.categoryType === category.type)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const expected = Math.round((day / total) * category.monthlyLimit);
    const isDebt = category.type === "debt";
    const remaining = isDebt ? Math.max(0, category.monthlyLimit - actual) : category.monthlyLimit - actual;
    const status = isDebt
      ? actual >= expected ? "green" : actual > 0 ? "orange" : "red"
      : actual > category.monthlyLimit ? "red" : actual > expected ? "orange" : "green";
    const riskScore = expected > 0
      ? Number(((isDebt ? Math.max(0, expected - actual) / expected : actual / expected) * category.weight).toFixed(2))
      : 0;

    return {
      ...category,
      spent: actual,
      repaid: isDebt ? actual : undefined,
      expected,
      remaining,
      status,
      riskScore,
      progress: category.monthlyLimit > 0 ? Math.min(100, Math.round((actual / category.monthlyLimit) * 100)) : 0,
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
      const remainingDays = Math.max(1, monthProgress().total - monthProgress().day);
      if (category.type === "debt") {
        const shortfall = Math.max(0, category.expected - category.spent);
        recs.push({
          id: id("rec"),
          severity: category.status === "red" ? "high" : "medium",
          title: `${category.label} repayment is behind pace`,
          body: `You are ${money(shortfall)} behind the expected repayment pace. Pay about ${money(shortfall / Math.ceil(remainingDays / 7))} extra per week to catch up this month.`,
        });
        return;
      }
      const excess = Math.max(0, category.spent - category.expected);
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

function addMonthsClamped(date, months, preferredDay) {
  const candidate = new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
  const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
  candidate.setDate(Math.min(preferredDay, lastDay));
  return candidate;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function estimateEmi({ principal, annualInterestRate, months }) {
  if (months <= 0) return 0;
  if (annualInterestRate <= 0) return Math.ceil(principal / months);
  const monthlyRate = annualInterestRate / 100 / 12;
  const factor = (1 + monthlyRate) ** months;
  return Math.ceil((principal * monthlyRate * factor) / (factor - 1));
}

export function debtAnalytics(debts, monthlyIncome, today = new Date()) {
  return debts.map((debt) => {
    const originalAmount = Number(debt.originalAmount || 0);
    const amountRepaid = Math.min(originalAmount, Number(debt.amountRepaid || 0));
    const remainingBalance = Math.max(0, originalAmount - amountRepaid);
    const remainingMonths = Number(debt.remainingMonths || 0);
    const estimatedEmi = estimateEmi({
      principal: remainingBalance,
      annualInterestRate: Number(debt.annualInterestRate || 0),
      months: remainingMonths,
    });
    const repaymentProgress = originalAmount > 0 ? Math.round((amountRepaid / originalAmount) * 100) : 0;
    const emiRate = monthlyIncome > 0 ? estimatedEmi / monthlyIncome : 0;
    const payoffDate = addMonthsClamped(today, Math.max(remainingMonths - 1, 0), Number(debt.emiDay || 1));
    const goalLabel = debt.goal === "catch_up"
      ? "Catch up if lagging"
      : debt.goal === "pay_ahead"
        ? "Pay ahead to finish early"
        : "Stay consistent";
    const status = remainingBalance <= 0 ? "paid" : emiRate > 0.4 ? "high-risk" : emiRate > 0.25 ? "watch" : "on-track";
    const goalAction = debt.goal === "pay_ahead"
      ? `Target more than ${money(estimatedEmi)} when possible to shorten the loan.`
      : debt.goal === "catch_up"
        ? `Prioritize the next ${money(estimatedEmi)} due date before adding discretionary spending.`
        : `Keep paying ${money(estimatedEmi)} on the EMI date to stay on schedule.`;

    return {
      ...debt,
      originalAmount,
      amountRepaid,
      remainingBalance,
      remainingMonths,
      estimatedEmi,
      repaymentProgress,
      emiRate,
      payoffDate: dateKey(payoffDate),
      goalLabel,
      goalAction,
      status,
    };
  });
}

export function debtEmiReminders(debts, today = new Date()) {
  return debts.flatMap((debt) => {
    if (!debt.remainingMonths || debt.remainingBalance <= 0) return [];
    return Array.from({ length: Math.min(debt.remainingMonths, 240) }, (_, index) => {
      const dueDate = addMonthsClamped(today, index, Number(debt.emiDay || 1));
      return {
        id: `${debt.id}-${dateKey(dueDate)}`,
        debtId: debt.id,
        name: debt.name,
        date: dateKey(dueDate),
        amountDue: debt.estimatedEmi,
        goal: debt.goal,
        goalLabel: debt.goalLabel,
        status: debt.status,
      };
    });
  });
}

export function debtAlerts(debts) {
  return debts.flatMap((debt) => {
    const alerts = [];
    if (debt.emiRate > 0.4) {
      alerts.push({ level: "risk", message: `${debt.name} EMI is ${Math.round(debt.emiRate * 100)}% of monthly income. Treat this as high repayment risk.` });
    } else if (debt.emiRate > 0.25) {
      alerts.push({ level: "warn", message: `${debt.name} EMI is ${Math.round(debt.emiRate * 100)}% of monthly income. Keep lifestyle spending tight around the due date.` });
    }
    if (debt.goal === "pay_ahead") {
      alerts.push({ level: "info", message: `${debt.name}: paying above ${money(debt.estimatedEmi)} can shorten the estimated payoff timeline.` });
    }
    return alerts;
  });
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
