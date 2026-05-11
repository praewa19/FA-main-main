import { GoogleGenAI } from "@google/genai";
import { differenceInCalendarDays } from "date-fns";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/auth";
import { ageFromBirthdate, applyDebtRepaymentTarget, debtAnalytics, enrichCategories } from "@/lib/budget";
import { toCategory, toDebtObligation, toGoal, toIncome, toInvestmentHolding, toProfile, toSavingsTarget, toTransaction } from "@/lib/data";
import { summarizePortfolio } from "@/lib/investments";

const APP_TIMEZONE = "Asia/Kolkata";
const INSIGHTS_CACHE_TTL_MS = 15 * 60 * 1000;
const insightsCache = globalThis.__finovaInsightsCache || new Map();

if (!globalThis.__finovaInsightsCache) {
  globalThis.__finovaInsightsCache = insightsCache;
}

export const assistantChatSchema = z.object({
  page: z.string().min(1).max(32),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(20),
});

export function geminiClient() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export function sanitizeAssistantText(text = "") {
  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

export function assistantModels() {
  return [
    process.env.GEMINI_MODEL_PRIMARY || "gemini-3.1-flash-lite-preview",
    process.env.GEMINI_MODEL_FALLBACK || "gemini-3-flash-preview",
    "gemini-2.5-flash",
  ];
}

export function toChatHistory(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function currentDateKey(timeZone = APP_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function daysUntil(deadline, todayKey) {
  if (!deadline) return null;
  const target = new Date(`${deadline}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(today.getTime())) return null;
  return Math.max(0, differenceInCalendarDays(target, today));
}

function roundAmount(value) {
  return Math.round(Number(value || 0));
}

function deriveGoalMetrics(goal, todayKey) {
  const target = Number(goal.target || 0);
  const current = Number(goal.current || 0);
  const amountLeft = Math.max(0, target - current);
  const daysLeft = daysUntil(goal.deadline, todayKey);
  const requiredDaily = daysLeft === null ? null : amountLeft > 0 ? roundAmount(amountLeft / Math.max(daysLeft, 1)) : 0;
  const requiredWeekly = daysLeft === null ? null : amountLeft > 0 ? roundAmount(amountLeft / Math.max(daysLeft / 7, 1)) : 0;
  const requiredMonthly = daysLeft !== null && daysLeft > 45 && amountLeft > 0
    ? roundAmount(amountLeft / Math.max(daysLeft / 30.4375, 1))
    : null;

  let paceWindow = "monthly";
  if (daysLeft !== null && daysLeft < 45) paceWindow = daysLeft <= 14 ? "daily" : "weekly";

  let urgency = "on_track";
  if (daysLeft !== null && amountLeft > 0) {
    if (daysLeft <= 31) urgency = "urgent";
    else if (daysLeft <= 90) urgency = "due_soon";
  }

  return {
    id: goal.id,
    name: goal.name,
    priority: goal.priority,
    deadline: goal.deadline,
    target,
    current,
    amountLeft,
    daysLeft,
    requiredDaily,
    requiredWeekly,
    requiredMonthly,
    paceWindow,
    urgency,
  };
}

function relevantTransactionsForPage(page, transactions) {
  if (page === "goals") {
    return transactions
      .filter((item) => item.goalId || String(item.categoryType || "").startsWith("goal:"))
      .map((item) => ({
        date: item.date,
        categoryType: item.categoryType,
        goalId: item.goalId || "",
        amount: Number(item.amount || 0),
        note: item.note || "",
      }));
  }
  return transactions.slice(0, 10).map((item) => ({
    date: item.date,
    categoryType: item.categoryType,
    goalId: item.goalId || "",
    amount: Number(item.amount || 0),
    note: item.note || "",
  }));
}

export async function loadAssistantContext(userId) {
  const supabase = await createSupabaseServerClient();
  const [
    { data: profileRow },
    { data: incomeRow },
    { data: categoryRows },
    { data: transactionRows },
    { data: debtRows },
    { data: goalRows, error: goalsError },
    { data: savingsRows, error: savingsError },
    { data: holdingsRows, error: holdingsError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("incomes").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(40),
    supabase.from("debt_obligations").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("savings_targets").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("investment_holdings").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  const today = currentDateKey();
  const profile = toProfile(profileRow);
  const income = toIncome(incomeRow);
  const transactions = (transactionRows || []).map(toTransaction);
  const holdings = holdingsError && !["42P01", "PGRST205"].includes(holdingsError.code) ? [] : (holdingsRows || []).map(toInvestmentHolding);
  const debts = (debtRows || []).map(toDebtObligation);
  const debtStats = debtAnalytics(debts, income?.monthlyIncome || 0);
  const categories = enrichCategories(
    applyDebtRepaymentTarget((categoryRows || []).map(toCategory), debtStats),
    transactions,
  );
  const goals = goalsError && !["42P01", "PGRST205"].includes(goalsError.code) ? [] : (goalRows || []).map(toGoal);
  const savingsTargets = savingsError && !["42P01", "PGRST205"].includes(savingsError.code) ? [] : (savingsRows || []).map(toSavingsTarget);
  const incomeValue = Number(income?.monthlyIncome || 0);
  const totalExpenses = transactions.filter((item) => item.categoryType !== "credit").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCredits = transactions.filter((item) => item.categoryType === "credit").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const portfolio = holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.name,
    shares: Number(holding.shares || 0),
    totalCost: Number(holding.totalCost || 0),
  }));

  return {
    today,
    timeZone: APP_TIMEZONE,
    profile: profile ? {
      name: profile.name,
      mode: profile.mode,
      priority: profile.priority,
      hasDebt: profile.hasDebt,
      age: ageFromBirthdate(profile.birthdate),
    } : null,
    income: income ? {
      period: income.period,
      monthlyIncome: incomeValue,
      originalAmount: Number(income.amount || 0),
    } : null,
    categories: categories.map((category) => ({
      label: category.label,
      type: category.type,
      limit: Number(category.monthlyLimit || 0),
      spent: Number(category.spent || 0),
      status: category.status,
      expected: Number(category.expected || 0),
      remaining: Number(category.remaining || 0),
    })),
    totals: {
      monthlyIncome: incomeValue,
      totalExpenses,
      totalCredits,
      netBalance: incomeValue + totalCredits - totalExpenses,
    },
    debtObligations: debtStats.map((debt) => ({
      name: debt.name,
      estimatedEmi: debt.estimatedEmi,
      remainingBalance: debt.remainingBalance,
      status: debt.status,
    })),
    goals: goals.map((goal) => deriveGoalMetrics(goal, today)),
    savingsTargets: savingsTargets.map((target) => ({
      name: target.name,
      target: Number(target.target || 0),
      current: Number(target.current || 0),
      monthlyContribution: Number(target.monthlyContribution || 0),
    })),
    investments: {
      holdings: portfolio,
      totals: summarizePortfolio(portfolio.map((holding) => ({
        ...holding,
        currentValue: holding.totalCost,
      }))),
    },
    recentTransactions: relevantTransactionsForPage("default", transactions),
    goalTransactions: relevantTransactionsForPage("goals", transactions),
  };
}

export function pageInstruction(page) {
  switch (page) {
    case "budget":
      return "Focus on allocation percentages, savings tradeoffs, and category pressure.";
    case "transactions":
      return "Focus on recent spending behavior, pace against budget, and unusual transaction patterns.";
    case "goals":
      return "Focus on goal progress, contribution pace, prioritization, and concrete next savings moves.";
    case "savings":
      return "Focus on savings rate, contribution cadence, and emergency fund guidance.";
    case "analytics":
      return "Focus on patterns, trends, and what is driving the score.";
    case "investments":
      return "Focus on holdings, cost basis, unrealized gain, diversification, and watchlist context. Do not fabricate live prices if they are not in context.";
    case "assistant":
      return "Answer broadly across the full financial workspace while still anchoring to the user's actual data.";
    default:
      return "Focus on the user's current Finova page and explain insights using their own numbers.";
  }
}

export function assistantSystemInstruction(page, context) {
  return [
    "You are Finova's personal AI finance assistant.",
    "Stay grounded in the supplied Finova data. If something is missing, say that directly instead of inventing numbers.",
    "Be concise, practical, and numerically specific.",
    "Do not present yourself as a licensed financial advisor or give guarantees.",
    "Treat the provided current date and timezone as authoritative.",
    "When a goal deadline is close, use days or weeks remaining rather than describing it as a monthly contribution target.",
    pageInstruction(page),
    `Current page: ${page}.`,
    `Current date: ${context.today}.`,
    `Timezone: ${context.timeZone}.`,
    `User context JSON: ${JSON.stringify(context)}`,
  ].join("\n");
}

function contextFingerprintPayload(page, context) {
  switch (page) {
    case "goals":
      return {
        today: context.today,
        goals: context.goals,
        goalTransactions: context.goalTransactions,
      };
    case "savings":
      return {
        today: context.today,
        income: context.income,
        savingsTargets: context.savingsTargets,
        goals: context.goals,
      };
    default:
      return {
        today: context.today,
        totals: context.totals,
        categories: context.categories,
        recentTransactions: context.recentTransactions,
      };
  }
}

export function pageInsightsFingerprint(page, context) {
  return createHash("sha1").update(JSON.stringify(contextFingerprintPayload(page, context))).digest("hex");
}

export function getCachedInsights(userId, page, fingerprint) {
  const key = `${userId}:${page}`;
  const cached = insightsCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    insightsCache.delete(key);
    return null;
  }
  if (cached.fingerprint !== fingerprint) return null;
  return cached.value;
}

export function setCachedInsights(userId, page, fingerprint, value) {
  insightsCache.set(`${userId}:${page}`, {
    fingerprint,
    value,
    expiresAt: Date.now() + INSIGHTS_CACHE_TTL_MS,
  });
}

export async function generateAssistantChatReply({ ai, page, context, messages }) {
  const history = messages.slice(0, -1);
  const latest = messages[messages.length - 1];
  const systemInstruction = assistantSystemInstruction(page, context);

  let lastError = new Error("AI request failed.");
  for (const model of assistantModels()) {
    try {
      const chat = ai.chats.create({
        model,
        history: toChatHistory(history),
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 900,
        },
      });
      const response = await chat.sendMessage({ message: latest.content });
      const reply = sanitizeAssistantText(response.text?.trim());
      if (!reply) throw new Error("Empty AI response.");
      return { reply, modelUsed: model };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function generatePageInsights({ ai, page, context }) {
  const systemInstruction = assistantSystemInstruction(page, context);
  const prompt = page === "goals"
    ? [
      "Return exactly 3 short bullet insights for the goals page.",
      "Each insight must be grounded in the supplied goals data and mention exact numbers when useful.",
      "Use the provided current date and each goal's daysLeft, amountLeft, requiredDaily, requiredWeekly, and requiredMonthly fields correctly.",
      "Do not describe a goal as a monthly savings target when daysLeft is under 45. Use daily or weekly pace instead.",
      "If a goal is due this month or within 31 days, explicitly mention the exact deadline pressure.",
      "Return plain text bullets only with no headings.",
    ].join(" ")
    : page === "investments"
      ? [
        "Return exactly 3 investment insight cards.",
        "Each line must use the format: Title | Body",
        "Title must be 2 to 5 words.",
        "Body must be one short sentence grounded in the user's actual portfolio data and use specific numbers when possible.",
        "Focus on concentration, range performance, pricing gaps, diversification, and meaningful watchlist context.",
        "Return plain text only with exactly 3 lines and no bullet symbols.",
      ].join(" ")
    : `Return exactly 3 short bullet insights for the ${page} page. Each insight must be grounded in the user's actual data and mention specific numbers when possible. Return plain text bullets only.`;

  let lastError = new Error("AI request failed.");
  for (const model of assistantModels()) {
    try {
      const response = await ai.models.generateContent({
        model,
        config: {
          systemInstruction,
          temperature: 0.35,
          maxOutputTokens: 500,
        },
        contents: prompt,
      });
      const text = response.text?.trim();
      if (!text) throw new Error("Empty AI response.");
      const insights = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      if (!insights.length) throw new Error("AI returned no insights.");
      return { insights, modelUsed: model };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
