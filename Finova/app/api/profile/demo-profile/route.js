import { applyDebtRepaymentTarget, buildBudgetPlan, debtAnalytics } from "@/lib/budget";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import {
  fetchAllRows,
  fromBudgetPlan,
  fromCategory,
  fromCustomHabit,
  fromDebtObligation,
  fromGoal,
  fromHabit,
  fromHabitLog,
  fromIncome,
  fromInvestmentHolding,
  fromProfile,
  fromSavingsTarget,
  fromTransaction,
} from "@/lib/data";
import { invalidateCachedMarketSnapshot } from "@/lib/market-session-cache";
import { id, nowIso, publicUser } from "@/lib/store";

const INDIAN_API_BASE = "https://stock.indianapi.in";
const START_DATE = "2025-05-01";
const TODAY = new Date("2026-05-10T12:00:00+05:30");
const GOAL_DEADLINE = "2026-12-31";

const GOAL_BLUEPRINTS = [
  { key: "small", name: "Weekend Escape", emoji: "\u2600\uFE0F", target: 52000, priority: "low" },
  { key: "medium", name: "Career Upgrade Fund", emoji: "\u{1F4BB}", target: 220000, priority: "medium" },
  { key: "largeA", name: "Japan Trip", emoji: "\u2708\uFE0F", target: 480000, priority: "high" },
  { key: "largeB", name: "Emergency Reserve", emoji: "\u{1F6E1}\uFE0F", target: 720000, priority: "high" },
];

const HOLDING_BLUEPRINTS = [
  { symbol: "RELIANCE", name: "Reliance Industries", shares: 24, exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", shares: 8, exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", shares: 16, exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", shares: 18, exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", shares: 22, exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", shares: 28, exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", shares: 18, exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", shares: 9, exchange: "NSE" },
  { symbol: "ITC", name: "ITC", shares: 32, exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", shares: 16, exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank", shares: 18, exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", shares: 12, exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", shares: 7, exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki", shares: 4, exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints", shares: 11, exchange: "NSE" },
];

const DAILY_HABITS = [
  { name: "Daily budget tracking", description: "Review and log every spend before the day closes.", icon: "\u{1F4CA}", cadence: "daily", targetDays: 30, rate: 0.86 },
  { name: "Save before spending", description: "Move money into savings or a goal before discretionary purchases.", icon: "\u{1F4B8}", cadence: "daily", targetDays: 20, rate: 0.74 },
  { name: "Weekly budget review", description: "Review category drift and adjust the next few days.", icon: "\u{1F6E1}", cadence: "weekly", targetDays: 12, rate: 0.8 },
];

const ESSENTIAL_NOTES = ["Milk and groceries", "Metro recharge", "Utility payment", "Vegetables", "Breakfast", "Medicines", "Petrol refill", "Quick grocery stop"];
const LIFESTYLE_NOTES = ["Coffee run", "Streaming subscription", "Dining out", "Impulse snack", "Online shopping", "Game top-up", "Weekend movie", "Food delivery"];
const SAVINGS_NOTES = ["Auto-transfer to savings", "Recurring SIP transfer", "Cash set aside", "Rainy day transfer"];
const DEBT_NOTES = ["Card bill payment", "EMI transfer", "Debt catch-up"];
const CREDIT_NOTES = ["Salary credit", "Freelance payout", "Cashback", "Refund received"];

function indianApiKey() {
  return process.env.INDIAN_API_KEY || process.env.STOCK_INDIANAPI_KEY || "";
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(random, list) {
  return list[randomInt(random, 0, list.length - 1)];
}

function dateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function chunk(list, size) {
  const chunks = [];
  for (let index = 0; index < list.length; index += size) chunks.push(list.slice(index, index + size));
  return chunks;
}

async function insertInChunks(supabase, table, rows, size = 500) {
  for (const batch of chunk(rows, size)) {
    const { error } = await supabase.from(table).insert(batch);
    if (error && !["42P01", "PGRST205"].includes(error.code)) throw error;
  }
}

async function verifyTransactionCoverage(supabase, userId) {
  const rows = await fetchAllRows(() => supabase
    .from("transactions")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true }));
  if (!rows?.length) {
    return { ok: false, reason: "no_rows" };
  }

  const dates = rows
    .map((row) => String(row.date || ""))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));

  if (!dates.length) {
    return { ok: false, reason: "invalid_dates" };
  }

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const months = new Set(dates.map((date) => date.slice(0, 7)));
  const expectedMonths = monthList().map((date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  const missingMonths = expectedMonths.filter((month) => !months.has(month));

  return {
    ok: firstDate === START_DATE && lastDate === dateKey(TODAY) && missingMonths.length === 0,
    firstDate,
    lastDate,
    count: dates.length,
    missingMonths,
  };
}

async function seedTransactionsWithVerification(supabase, userId, transactions) {
  let verification = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error: deleteError } = await supabase.from("transactions").delete().eq("user_id", userId);
    if (deleteError && !["42P01", "PGRST205"].includes(deleteError.code)) throw deleteError;

    await insertInChunks(supabase, "transactions", transactions.map(fromTransaction), 500);
    verification = await verifyTransactionCoverage(supabase, userId);
    if (verification.ok) return verification;
  }

  throw new Error(`Demo transaction history verification failed. Range=${verification?.firstDate || "unknown"}..${verification?.lastDate || "unknown"}, missingMonths=${(verification?.missingMonths || []).join(",") || "none"}`);
}

function isMissingCadenceColumn(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("cadence") && (message.includes("schema cache") || message.includes("column"));
}

async function clearUserData(supabase, userId) {
  const tables = [
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
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error && !["42P01", "PGRST205"].includes(error.code)) throw error;
  }
}

async function fetchIndianHistory(symbol) {
  const key = indianApiKey();
  if (!key) return [];
  const search = new URLSearchParams({ stock_name: symbol, period: "1yr", filter: "price" });
  const response = await fetch(`${INDIAN_API_BASE}/historical_data?${search.toString()}`, {
    cache: "no-store",
    headers: { "x-api-key": key },
  });
  const data = await response.json();
  if (!response.ok) return [];
  const dataset = (data?.datasets || []).find((item) => String(item.metric || "").toLowerCase() === "price") || data?.datasets?.[0];
  return Array.isArray(dataset?.values) ? dataset.values : [];
}

function monthList() {
  const months = [];
  const cursor = new Date("2025-05-01T12:00:00+05:30");
  while (cursor <= TODAY) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function randomDayInMonth(random, monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = monthDate.getFullYear() === TODAY.getFullYear() && monthDate.getMonth() === TODAY.getMonth()
    ? TODAY.getDate()
    : new Date(year, month + 1, 0).getDate();
  return new Date(year, month, randomInt(random, 1, lastDay), 12);
}

function generateTransactions(userId, goals, monthlyIncome) {
  const random = seededRandom(20260510);
  const months = monthList();
  const goalTotals = Object.fromEntries(goals.map((goal) => [goal.id, 0]));
  const transactions = [];

  months.forEach((monthDate, monthIndex) => {
    const monthId = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const monthlyCount = 420 + ((monthIndex * 13) % 71);
    const monthTransactions = [];

    monthTransactions.push({
      id: id("tx"),
      userId,
      categoryType: "credit",
      goalId: "",
      amount: monthlyIncome,
      note: "Salary credit",
      date: `${monthId}-01`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    if (monthDate.getFullYear() === TODAY.getFullYear() && monthDate.getMonth() === TODAY.getMonth()) {
      monthTransactions.push({
        id: id("tx"),
        userId,
        categoryType: "essentials",
        goalId: "",
        amount: 185,
        note: "Today grocery stop",
        date: dateKey(TODAY),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
    monthTransactions.push({
      id: id("tx"),
      userId,
      categoryType: "credit",
      goalId: "",
      amount: 1800 + (monthIndex % 6) * 350,
      note: pick(random, CREDIT_NOTES),
      date: dateKey(randomDayInMonth(random, monthDate)),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    monthTransactions.push({
      id: id("tx"),
      userId,
      categoryType: "credit",
      goalId: "",
      amount: 250 + (monthIndex % 5) * 125,
      note: "Cashback credit",
      date: dateKey(randomDayInMonth(random, monthDate)),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    goals.forEach((goal, goalIndex) => {
      for (let count = 0; count < 3; count += 1) {
        const baseRanges = [
          [900, 1400],
          [2000, 3200],
          [3200, 5000],
          [4500, 6800],
        ];
        const [min, max] = baseRanges[goalIndex];
        const amount = randomInt(random, min, max);
        goalTotals[goal.id] += amount;
        monthTransactions.push({
          id: id("tx"),
          userId,
          categoryType: `goal:${goal.id}`,
          goalId: goal.id,
          amount,
          note: `saved towards ${goal.name}`,
          date: dateKey(randomDayInMonth(random, monthDate)),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
    });

    for (let count = 0; count < 42; count += 1) {
      monthTransactions.push({
        id: id("tx"),
        userId,
        categoryType: "savings",
        goalId: "",
        amount: randomInt(random, 120, 260),
        note: pick(random, SAVINGS_NOTES),
        date: dateKey(randomDayInMonth(random, monthDate)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    for (let count = 0; count < 3; count += 1) {
      monthTransactions.push({
        id: id("tx"),
        userId,
        categoryType: "debt",
        goalId: "",
        amount: count === 0 ? 6400 : randomInt(random, 650, 1450),
        note: pick(random, DEBT_NOTES),
        date: dateKey(randomDayInMonth(random, monthDate)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    const remaining = Math.max(0, monthlyCount - monthTransactions.length);
    const essentialsCount = Math.floor(remaining * 0.61);
    const lifestyleCount = remaining - essentialsCount;

    for (let count = 0; count < essentialsCount; count += 1) {
      monthTransactions.push({
        id: id("tx"),
        userId,
        categoryType: "essentials",
        goalId: "",
        amount: randomInt(random, 45, 220),
        note: pick(random, ESSENTIAL_NOTES),
        date: dateKey(randomDayInMonth(random, monthDate)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    for (let count = 0; count < lifestyleCount; count += 1) {
      monthTransactions.push({
        id: id("tx"),
        userId,
        categoryType: "lifestyle",
        goalId: "",
        amount: randomInt(random, 35, 180),
        note: pick(random, LIFESTYLE_NOTES),
        date: dateKey(randomDayInMonth(random, monthDate)),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    transactions.push(...monthTransactions);
  });

  return { transactions, goalTotals };
}

function buildDemoHabits(userId) {
  const random = seededRandom(90210);
  const start = new Date("2025-05-01T12:00:00+05:30");
  const habits = DAILY_HABITS.map((habit) => ({
    id: id("habit_custom"),
    userId,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    cadence: habit.cadence,
    targetDays: habit.targetDays,
    completedToday: false,
    streak: 0,
    bestStreak: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  const habitLogs = [];
  const dailyHabits = [];
  const todayKey = dateKey(TODAY);

  for (let cursor = new Date(start); cursor <= TODAY; cursor.setDate(cursor.getDate() + 1)) {
    const dayKey = dateKey(cursor);
    habits.forEach((habit, index) => {
      const source = DAILY_HABITS[index];
      const isWeekly = source.cadence === "weekly";
      const shouldLog = !isWeekly || cursor.getDay() === 1;
      if (!shouldLog) return;
      const completed = random() < source.rate;
      habitLogs.push({
        id: id("habit_log"),
        userId,
        habitId: habit.id,
        logDate: dayKey,
        completed,
        createdAt: nowIso(),
      });
      if (dayKey === todayKey) habit.completedToday = completed;
    });

    dailyHabits.push({
      id: id("habit"),
      userId,
      date: dayKey,
      budgetAdherence: random() < 0.74,
      spendingControl: random() < 0.69,
      savingsAction: random() < 0.77,
      createdAt: nowIso(),
    });
  }

  return { habits, habitLogs, dailyHabits };
}

async function buildDemoHoldings(userId) {
  const rows = [];
  for (const item of HOLDING_BLUEPRINTS) {
    const history = await fetchIndianHistory(item.symbol);
    const firstPoint = history[0];
    const firstPrice = Number(firstPoint?.[1] || 1000);
    rows.push({
      id: id("holding"),
      userId,
      symbol: item.symbol,
      name: item.name,
      shares: item.shares,
      totalCost: Number((firstPrice * item.shares).toFixed(2)),
      assetType: "stock",
      exchange: item.exchange,
      currency: "INR",
      createdAt: `${START_DATE}T09:15:00+05:30`,
      updatedAt: nowIso(),
    });
  }
  return rows;
}

export async function POST() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  try {
    invalidateCachedMarketSnapshot(current.id);
    await clearUserData(supabase, current.id);

    const monthlyIncome = 78000;
    const profile = {
      id: id("profile"),
      userId: current.id,
      name: "Maggi",
      birthdate: "2005-02-09",
      priority: "saving",
      mode: "professional",
      hasDebt: true,
      updatedAt: nowIso(),
    };
    const income = {
      id: id("income"),
      userId: current.id,
      period: "monthly",
      amount: monthlyIncome,
      monthlyIncome,
      updatedAt: nowIso(),
    };

    const generated = buildBudgetPlan({
      userId: current.id,
      monthlyIncome,
      hasDebt: true,
      priority: profile.priority,
      mode: profile.mode,
      birthdate: profile.birthdate,
    });

    const debtSeed = {
      id: id("debt"),
      userId: current.id,
      name: "Education Loan",
      originalAmount: 280000,
      annualInterestRate: 10.25,
      remainingMonths: 28,
      amountRepaid: 96000,
      emiDay: 5,
      goal: "pay_ahead",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const debtTargets = debtAnalytics([debtSeed], monthlyIncome);
    const categories = applyDebtRepaymentTarget(generated.categories, debtTargets);

    const goalRows = GOAL_BLUEPRINTS.map((goal) => ({
      id: id("goal"),
      userId: current.id,
      name: goal.name,
      emoji: goal.emoji,
      target: goal.target,
      current: 0,
      deadline: GOAL_DEADLINE,
      priority: goal.priority,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }));

    const { transactions, goalTotals } = generateTransactions(current.id, goalRows, monthlyIncome);
    goalRows.forEach((goal) => {
      goal.current = Number((goalTotals[goal.id] || 0).toFixed(2));
    });

    const totalSavingsContributions = transactions
      .filter((transaction) => transaction.categoryType === "savings")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const savingsTarget = {
      id: id("sav"),
      userId: current.id,
      name: "Monthly Savings Goal",
      target: 18000,
      current: totalSavingsContributions,
      monthlyContribution: 18000,
      deadline: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const { habits, habitLogs, dailyHabits } = buildDemoHabits(current.id);
    const holdings = await buildDemoHoldings(current.id);

    const upserts = await Promise.all([
      supabase.from("profiles").upsert(fromProfile(profile), { onConflict: "user_id" }),
      supabase.from("incomes").upsert(fromIncome(income), { onConflict: "user_id" }),
      supabase.from("budget_plans").upsert(fromBudgetPlan(generated.plan), { onConflict: "user_id" }),
    ]);
    const upsertError = upserts.find((result) => result.error)?.error;
    if (upsertError) throw upsertError;

    await insertInChunks(supabase, "categories", categories.map(fromCategory), 100);
    await insertInChunks(supabase, "debt_obligations", [fromDebtObligation(debtSeed)], 50);
    await insertInChunks(supabase, "goals", goalRows.map(fromGoal), 50);
    await insertInChunks(supabase, "savings_targets", [fromSavingsTarget(savingsTarget)], 50);
    const transactionVerification = await seedTransactionsWithVerification(supabase, current.id, transactions);
    try {
      await insertInChunks(supabase, "custom_habits", habits.map(fromCustomHabit), 50);
    } catch (error) {
      if (!isMissingCadenceColumn(error)) throw error;
      await insertInChunks(supabase, "custom_habits", habits.map((habit) => {
        const row = fromCustomHabit(habit);
        delete row.cadence;
        return row;
      }), 50);
    }
    await insertInChunks(supabase, "habit_logs", habitLogs.map(fromHabitLog), 500);
    await insertInChunks(supabase, "habits", dailyHabits.map(fromHabit), 500);
    await insertInChunks(supabase, "investment_holdings", holdings.map(fromInvestmentHolding), 100);
    invalidateCachedMarketSnapshot(current.id);

    return Response.json({
      ok: true,
      user: publicUser({ ...current, onboardingComplete: true }),
      message: `Demo profile loaded for Maggi. Transactions verified from ${transactionVerification.firstDate} to ${transactionVerification.lastDate}.`,
    });
  } catch (error) {
    return Response.json({ error: error.message || "Demo profile could not be generated." }, { status: 400 });
  }
}

