"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Activity,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CircleGauge,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  IndianRupee,
  KeyRound,
  Medal,
  LogOut,
  Mail,
  Menu,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const ActualExpectedChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.ActualExpectedChart), {
  loading: () => <ChartSkeleton title="Actual vs Expected" />,
  ssr: false,
});

const OverviewPage = memo(function OverviewPage({ profile, income, health, alerts, recommendations, goals, savingsGuidance, onTab }) {
  return (
    <div className="dashboard-page overview-page">
      <section className="overview-hero">
        <div>
          <p className="eyebrow">Good to see you, {profile.name}</p>
          <h2>Your money is {health.category.toLowerCase()} today.</h2>
          <p className="lead">A clean snapshot of your score, risks, recommendations, and goals before you go deeper.</p>
          <div className="overview-actions">
            <button className="btn" onClick={() => onTab("dashboard")}><BarChart3 size={17} />Go to main app</button>
            <button className="btn secondary" onClick={() => onTab("budget")}><Wallet size={17} />Adjust budget</button>
          </div>
        </div>
        <div className="score-card">
          <div className="score-ring-luxury" style={{ "--score": `${health.score}%` }}>
            <div className="score-value"><span>{health.score}</span><small>/100</small></div>
          </div>
          <strong>{formatMoney(income.monthlyIncome)}</strong>
          <span className="hint">monthly income</span>
        </div>
      </section>
      <section className="overview-grid">
        <div className="panel section">
          <h2>Risk Alerts</h2>
          <div className="recommendations">
            {(alerts.length ? alerts : [{ level: "info", message: "No urgent risk alerts right now." }]).slice(0, 3).map((alert) => (
              <div key={alert.message} className={`alert ${alert.level}`}><AlertTriangle size={18} /><span>{alert.message}</span></div>
            ))}
          </div>
        </div>
        <RecommendationsPanel recommendations={recommendations.slice(0, 3)} />
        <div className="panel section">
          <h2>Goals Snapshot</h2>
          <div className="goal-mini-list">
            {(goals.length ? goals : [{ id: "empty", emoji: "*", name: "Add your first goal", current: 0, target: savingsGuidance?.recommendedMonthlySavings || 1, deadline: "" }]).slice(0, 3).map((goal) => (
              <GoalMini key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
        <div className="panel section">
          <h2>Savings Target</h2>
          <div className="metric-value">{Math.round((savingsGuidance?.recommendedSavingsRate || 0.2) * 100)}%</div>
          <p className="hint">Suggested monthly savings for age {savingsGuidance?.age || "profile"}: {formatMoney(savingsGuidance?.recommendedMonthlySavings || income.monthlyIncome * 0.2)}.</p>
        </div>
      </section>
    </div>
  );
});

function GoalMini({ goal }) {
  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  return (
    <div className="goal-mini">
      <span>{goal.emoji}</span>
      <div>
        <strong>{goal.name}</strong>
        <div className="bar"><span style={{ width: `${progress}%`, background: "#8B5CF6" }} /></div>
        <p className="hint">{formatMoney(goal.current)} of {formatMoney(goal.target)}</p>
      </div>
    </div>
  );
}

const DashboardPage = memo(function DashboardPage({
  categories,
  chartData,
  pieData,
  health,
  activeMonthLabel,
  canGoPrevious,
  canGoNext,
  onPreviousMonth,
  onNextMonth,
}) {
  return (
    <div className="dashboard-page dashboard-clean">
      <section className="panel section dashboard-month-panel">
        <div className="dashboard-month-heading">
          <div>
            <p className="eyebrow">Dashboard month</p>
            <h2>{activeMonthLabel}</h2>
            <p className="hint">Budget allocation, pace tracking, and spending distribution are scoped to this month only.</p>
          </div>
          <div className="dashboard-month-actions">
            <button className="btn secondary icon" type="button" onClick={onPreviousMonth} title="Previous month" disabled={!canGoPrevious}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn secondary icon" type="button" onClick={onNextMonth} title="Next month" disabled={!canGoNext}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <section className="dashboard-core-grid">
        <div className="panel section health-metric dashboard-health-card">
          <div className="score-wrap">
            <div className="score-ring-luxury" style={{ "--score": `${health.score}%` }}>
              <div className="score-value"><span>{health.score}</span><small>/100</small></div>
            </div>
            <div><h2>{health.category}</h2><p className="hint">Financial health score</p></div>
          </div>
        </div>
        <BudgetAllocationList categories={categories} />
      </section>
      <section className="analytics-grid">
        <MonthlyPaceTrackerChart chartData={chartData} />
        <CategoryDistributionChart pieData={pieData} />
      </section>
    </div>
  );
});

const BudgetAllocationList = memo(function BudgetAllocationList({ categories }) {
  return (
    <div className="panel section allocation-card">
      <h2>Budget Allocation</h2>
      <div className="allocation-grid">
        {categories.map((category) => {
          const percentage = category.monthlyLimit > 0 ? Math.round((category.spent / category.monthlyLimit) * 100) : 0;
          const displayPercentage = Math.max(0, percentage);
          const remaining = category.monthlyLimit - category.spent;
          return (
            <div className="allocation-tile" key={category.id}>
              <div className="allocation-tile-top">
                <strong>{category.label.replace(" / Discretionary", "")}</strong>
                <span>{displayPercentage}%</span>
              </div>
              <div className="allocation-track">
                <span style={{ width: `${Math.min(100, displayPercentage)}%`, background: categoryColors[category.type] || "#8B5CF6" }} />
              </div>
              <div className="allocation-money">
                <span>{formatMoney(category.spent)} / {formatMoney(category.monthlyLimit)}</span>
                <span className={remaining >= 0 ? "positive" : "negative"}>{remaining >= 0 ? formatMoney(remaining) + " left" : formatMoney(Math.abs(remaining)) + " over"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const BudgetPage = memo(function BudgetPage({ income, categories, hasDebt, savingsGuidance, recommendations, onDone }) {
  const defaultBudgetCategories = [
    { type: "essentials", label: "Essentials", priority: "High", description: "Rent, utilities, groceries, insurance" },
    { type: "debt", label: "Debt Payments", priority: "High", description: "Credit cards, loans, EMIs" },
    { type: "savings", label: "Savings", priority: "Medium", description: "Emergency fund, investments, retirement" },
    { type: "lifestyle", label: "Lifestyle", priority: "Low", description: "Entertainment, dining, shopping, hobbies" },
  ];

  function buildDraft(sourceCategories) {
    const byType = new Map(sourceCategories.map((category) => [category.type, category]));
    const base = defaultBudgetCategories
      .filter((category) => category.type !== "debt" || hasDebt || (byType.get("debt")?.monthlyLimit || 0) > 0)
      .map((category) => {
        const existing = byType.get(category.type);
        const fallbackPercent = category.type === "savings" ? Math.round((savingsGuidance?.recommendedSavingsRate || 0.2) * 100) : 0;
        return {
          id: existing?.id,
          type: category.type,
          label: category.type === "savings" ? "Savings" : (existing?.label || category.label),
          priority: existing?.priority || category.priority,
          description: category.description,
          isDefault: true,
          percentage: existing && income.monthlyIncome ? Math.round((existing.monthlyLimit / income.monthlyIncome) * 100) : fallbackPercent,
        };
      });
    const custom = sourceCategories
      .filter((category) => !defaultBudgetCategories.some((item) => item.type === category.type))
      .map((category) => ({
        id: category.id,
        type: category.type,
        label: category.label,
        priority: category.priority,
        description: "Custom category",
        isDefault: false,
        percentage: income.monthlyIncome ? Math.round((category.monthlyLimit / income.monthlyIncome) * 100) : 0,
      }));
    const next = [...base, ...custom];
    const total = next.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
    if (total < 100 && next.some((category) => category.type === "savings")) {
      return next.map((category) => category.type === "savings" ? { ...category, percentage: Number(category.percentage || 0) + (100 - total) } : category);
    }
    return next;
  }

  const [draft, setDraft] = useState(() => buildDraft(categories));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const total = draft.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
  const chartData = draft.map((category) => ({
    type: category.type,
    name: category.label,
    value: Math.round((income.monthlyIncome * Number(category.percentage || 0)) / 100),
    percent: Number(category.percentage || 0),
  }));

  useEffect(() => {
    setDraft(buildDraft(categories));
  }, [categories, income, savingsGuidance]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      setInsightsLoading(true);
      setInsightsError("");
      try {
        const result = await api("/api/assistant/insights", {
          method: "POST",
          body: JSON.stringify({ page: "budget" }),
        });
        if (!cancelled) setAiInsights(result.insights || []);
      } catch (err) {
        if (!cancelled) {
          setAiInsights([]);
          setInsightsError(err.message);
        }
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [categories, income.monthlyIncome, savingsGuidance?.recommendedMonthlySavings]);

  function updateCategory(index, patch) {
    setMessage("");
    setDraft((currentDraft) => {
      let nextDraft = currentDraft.map((category, current) => current === index ? { ...category, ...patch } : category);
      if (Object.hasOwn(patch, "percentage") && nextDraft[index]?.type !== "savings") {
        const totalWithoutSavings = nextDraft.reduce((sum, category) => category.type === "savings" ? sum : sum + Number(category.percentage || 0), 0);
        if (totalWithoutSavings <= 100) {
          nextDraft = nextDraft.map((category) => category.type === "savings" ? { ...category, percentage: 100 - totalWithoutSavings } : category);
        }
      }
      return nextDraft;
    });
  }

  async function save(changedType = "") {
    setError("");
    setMessage("");
    try {
      const payload = {
        categories: draft,
      };
      if (changedType) payload.changedType = changedType;
      await api("/api/budget", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage("Budget saved and backend updated.");
      await onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  function addCategory() {
    const key = `custom_${Date.now()}`;
    setDraft([...draft, { type: key, label: "New Category", priority: "Medium", description: "Custom category", isDefault: false, percentage: 0 }]);
  }

  function removeCategory(index) {
    const removed = draft[index];
    if (removed?.type === "savings") return;
    const next = draft.filter((_, current) => current !== index);
    const totalWithoutSavings = next.reduce((sum, category) => category.type === "savings" ? sum : sum + Number(category.percentage || 0), 0);
    setDraft(next.map((category) => category.type === "savings" && totalWithoutSavings <= 100 ? { ...category, percentage: 100 - totalWithoutSavings } : category));
  }

  return (
    <div className="dashboard-page">
      <section className="budget-primary-grid">
        <div className="panel section income-summary-card">
          <div className="section-heading">
            <div>
              <h2>Monthly Income</h2>
              <div className="income-display">{formatMoney(income.monthlyIncome)}</div>
              <p className="hint">{income.period === "annual" ? "Converted from annual income" : "Current monthly income"}</p>
            </div>
          </div>
        </div>
        <BudgetAllocationChart pieData={chartData} />
      </section>
      <section className="panel section">
        <div className="section-heading">
          <div><h2>Adjust Budget Allocation</h2><p className="hint">Change percentages, add categories, or remove categories. Save updates the backend.</p></div>
          <button className="btn secondary" type="button" onClick={addCategory}><Plus size={17} />Add category</button>
        </div>
        {total > 100 && <div className="alert risk"><AlertTriangle size={18} /><span>Total allocation is {total}%. Bring it back to 100% before saving.</span></div>}
        <div className="allocation-editor apple-allocation-editor">
          {draft.map((category, index) => (
            <div className="allocation-row" key={category.id || category.type}>
              <div className="allocation-row-head">
                <span className="allocation-dot" style={{ background: categoryColors[category.type] || "#8B5CF6" }} />
                <div className="allocation-copy">
                  {category.isDefault ? (
                    <strong>{category.label}</strong>
                  ) : (
                    <input className="allocation-name-input" value={category.label} onChange={(event) => updateCategory(index, { label: event.target.value })} />
                  )}
                  <p>{category.description}</p>
                </div>
                <input
                  className="allocation-slider"
                  style={{
                    "--slider-color": categoryColors[category.type] || "#8B5CF6",
                    "--slider-percent": `${category.percentage}%`,
                  }}
                  type="range"
                  min="0"
                  max="100"
                  value={category.percentage}
                  onChange={(event) => updateCategory(index, { percentage: Number(event.target.value) })}
                />
                <div className="allocation-values" style={{ color: categoryColors[category.type] || "#8B5CF6" }}>
                  <input type="number" min="0" max="100" value={category.percentage} onChange={(event) => updateCategory(index, { percentage: Number(event.target.value) })} />
                  <span>{formatMoney((income.monthlyIncome * category.percentage) / 100)}</span>
                </div>
                {!category.isDefault && <button className="btn secondary icon danger" type="button" title="Delete category" onClick={() => removeCategory(index)}><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
        </div>
        <div className={`allocation-total ${Math.round(total) === 100 ? "good" : "bad"}`}>
          <span>Total Allocation</span>
          <strong>{total}%</strong>
        </div>
        <button className="btn allocation-save" type="button" onClick={() => save()} disabled={total > 100}><Save size={17} />Save allocation</button>
        {message && <div className="alert info"><Check size={18} /><span>{message}</span></div>}
        {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
      </section>
      <AIInsightsPanel insights={aiInsights} loading={insightsLoading} error={insightsError} />
    </div>
  );
});

const MonthlyPaceTrackerChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.MonthlyPaceTrackerChart), {
  loading: () => <ChartSkeleton title="Monthly Pace Tracker" />,
  ssr: false,
});

const BudgetAllocationChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.BudgetAllocationChart), {
  loading: () => <ChartSkeleton title="Budget Allocation" />,
  ssr: false,
});

const CategoryDistributionChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.CategoryDistributionChart), {
  loading: () => <ChartSkeleton title="Spending Distribution" />,
  ssr: false,
});

const BehaviorRadarChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.BehaviorRadarChart), {
  loading: () => <ChartSkeleton title="Behavior Analysis" />,
  ssr: false,
});

const HealthScoreTrendChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.HealthScoreTrendChart), {
  loading: () => <ChartSkeleton title="Health Score Trend" />,
  ssr: false,
});

const categoryColors = {
  essentials: "#8B5CF6",
  debt: "#EF4444",
  savings: "#10B981",
  lifestyle: "#F59E0B",
  credit: "#3B82F6",
};

const categoryLabels = {
  essentials: "Essential Expenses",
  debt: "Debt & Obligations",
  savings: "Savings",
  lifestyle: "Lifestyle / Discretionary",
  credit: "Credit",
};

const GOAL_CATEGORY_PREFIX = "goal:";

const goalEmojiOptions = ["💰", "🏠", "🚗", "✈️", "🎓", "💻", "💍", "🏖️", "📈", "🛡️", "🎯", "⭐"];
const PORTFOLIO_SESSION_CACHE_KEY = "finova.market.portfolio";

function readPortfolioSessionCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PORTFOLIO_SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePortfolioSessionCache(portfolio) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PORTFOLIO_SESSION_CACHE_KEY, JSON.stringify(portfolio));
  } catch {
    // Ignore storage write failures and continue with live state.
  }
}

function clearPortfolioSessionCache() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PORTFOLIO_SESSION_CACHE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function goalAccent(goal) {
  const priority = String(goal?.priority || "medium").toLowerCase();
  if (priority === "high") return { color: "#22c55e", badge: "goal-priority-high" };
  if (priority === "low") return { color: "#8b5cf6", badge: "goal-priority-low" };
  return { color: "#f59e0b", badge: "goal-priority-medium" };
}

function goalCategoryType(goalId) {
  return `${GOAL_CATEGORY_PREFIX}${goalId}`;
}

function isGoalCategoryType(categoryType = "") {
  return categoryType.startsWith(GOAL_CATEGORY_PREFIX);
}

function buildGoalCategory(goal) {
  return {
    type: goalCategoryType(goal.id),
    label: goal.name,
    goalId: goal.id,
    color: goalAccent(goal).color,
  };
}

function buildTransactionCategories(categories = [], goals = []) {
  return [
    ...categories.map((category) => ({ ...category, goalId: "" })),
    ...goals.map(buildGoalCategory),
  ];
}

function findGoalByCategoryType(goals = [], categoryType = "") {
  if (!isGoalCategoryType(categoryType)) return null;
  const goalId = categoryType.slice(GOAL_CATEGORY_PREFIX.length);
  return goals.find((goal) => goal.id === goalId) || null;
}

function categoryLabelForTransaction(transaction, categories = [], goals = []) {
  const goal = transaction.goalId
    ? goals.find((item) => item.id === transaction.goalId)
    : findGoalByCategoryType(goals, transaction.categoryType);
  if (goal) return goal.name;
  return categories.find((category) => category.type === transaction.categoryType)?.label
    || categoryLabels[transaction.categoryType]
    || transaction.categoryType;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMarketMoney(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value || 0);
}

function formatSignedMoney(value, currency = "INR") {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : "-"}${formatMarketMoney(Math.abs(amount), currency)}`;
}

function formatSignedPercent(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)}%`;
}

function normalizeBirthdateInput(value = "") {
  const trimmed = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatBirthdateDisplay(value = "") {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
}

function formatDateTyping(value = "") {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeDisplayDateInput(value = "") {
  const trimmed = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatDisplayDateInput(value = "") {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return formatDateTyping(value);
}

function sanitizeMoneyInput(value = "") {
  const raw = String(value || "").replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart = "", ...decimalParts] = raw.split(".");
  const decimals = decimalParts.join("").slice(0, 2);
  const hasDot = raw.includes(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "");
  if (!integer && !decimals && !hasDot) return "";
  if (hasDot) return `${integer || "0"}.${decimals}`;
  return integer || "0";
}

function formatMoneyInput(value = "") {
  const sanitized = sanitizeMoneyInput(value);
  if (!sanitized) return "";
  const hasDot = sanitized.includes(".");
  const endsWithDot = sanitized.endsWith(".");
  const [integerPart = "0", decimals = ""] = sanitized.split(".");
  const formattedInteger = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(integerPart || 0));
  if (hasDot) return `${formattedInteger}.${endsWithDot ? "" : decimals}`;
  return formattedInteger;
}

function parseMoneyInput(value = "") {
  const normalized = String(value || "").replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatShortIndiaDate(value = "") {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function monthKeyFromDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key = "") {
  if (!/^\d{4}-\d{2}$/.test(key)) return "";
  const date = new Date(`${key}-01T12:00:00+05:30`);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function buildLineCoordinates(points = [], width = 100, height = 36) {
  if (!points.length) return [];
  const verticalInset = Math.max(2, Math.round(height * 0.08));
  const drawableHeight = Math.max(1, height - (verticalInset * 2));
  const prices = points.map((point) => Number(point.price || 0));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = verticalInset + (drawableHeight - (((Number(point.price || 0) - min) / range) * drawableHeight));
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  });
}

function buildLinePath(points = [], width = 100, height = 36, smooth = false) {
  const coordinates = buildLineCoordinates(points, width, height);
  if (!coordinates.length) return "";

  if (coordinates.length === 1) {
    return `M ${coordinates[0].x} ${coordinates[0].y}`;
  }

  if (!smooth) {
    return coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  return coordinates.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = coordinates[index - 1];
    const controlX = Number((((previous.x + point.x) / 2)).toFixed(2));
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function mergePortfolioSeries(positions = []) {
  const priced = positions.filter((position) => (position.chart || []).length);
  if (!priced.length) return [];
  const maxLength = Math.max(...priced.map((position) => position.chart.length));
  return Array.from({ length: maxLength }, (_, index) => ({
    label: priced[0].chart[index]?.label || `P${index + 1}`,
    price: priced.reduce((sum, position) => {
      const point = position.chart[index];
      return sum + Number(point?.price || 0) * Number(position.shares || 0);
    }, 0),
  })).filter((point) => point.price > 0);
}

function assistantQuestionsForPage(page = "dashboard") {
  switch (page) {
    case "budget":
      return [
        "Which category should I cut first without hurting savings?",
        "How balanced is this budget for my current income?",
        "What tradeoff would improve my next 30 days most?",
      ];
    case "transactions":
      return [
        "What is the main spending pattern on this page?",
        "Which recent transactions look avoidable?",
        "How far off pace am I this month?",
      ];
    case "goals":
      return [
        "Which goal needs more contribution pace?",
        "How should I prioritize these goals?",
        "What is my biggest goal risk right now?",
      ];
    case "savings":
      return [
        "Is my savings rate strong enough for my profile?",
        "How much should I move into savings this month?",
        "What is the cleanest way to close my savings gap?",
      ];
    case "analytics":
      return [
        "What is driving my financial score most?",
        "Which trend matters most in this dashboard?",
        "What should I fix first based on these analytics?",
      ];
    case "investments":
      return [
        "What does my portfolio concentration look like?",
        "Which holding is driving unrealized performance most?",
        "How do my holdings compare with the commodity watchlist today?",
      ];
    default:
      return [
        "What should I focus on first this week?",
        "What is the clearest risk in my finances right now?",
        "Give me three specific actions based on this page.",
      ];
  }
}

function pageLabelForAssistant(page = "dashboard") {
  return {
    dashboard: "Dashboard",
    budget: "Budget",
    transactions: "Transactions",
    goals: "Goals",
    habits: "Habits",
    savings: "Savings",
    analytics: "Analytics",
    investments: "Investments",
    assistant: "AI Assistant",
    settings: "Settings",
    overview: "Overview",
  }[page] || "Dashboard";
}

function assistantConversationTitle(text = "") {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New Chat";
  return clean.length > 56 ? `${clean.slice(0, 56).trim()}...` : clean;
}

function parseInsightCard(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return { title: "Insight", body: "" };
  const pipeIndex = clean.indexOf("|");
  if (pipeIndex >= 0) {
    return {
      title: clean.slice(0, pipeIndex).trim() || "Insight",
      body: clean.slice(pipeIndex + 1).trim(),
    };
  }
  const colonIndex = clean.indexOf(":");
  if (colonIndex >= 0) {
    return {
      title: clean.slice(0, colonIndex).trim() || "Insight",
      body: clean.slice(colonIndex + 1).trim(),
    };
  }
  return { title: "Insight", body: clean };
}

function assistantMessage(role, content, modelUsed = "") {
  return {
    role,
    content,
    ...(modelUsed ? { modelUsed } : {}),
    createdAt: new Date().toISOString(),
  };
}

function formatAssistantTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "The server returned an invalid response." };
  }
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function Home() {
  const [session, setSession] = useState({ user: null, profile: null, income: null });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview");
  const [isTabPending, startTabTransition] = useTransition();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setMessage("");
      const me = await api("/api/auth/me");
      setSession(me);
      if (me.user?.emailVerified && me.user?.onboardingComplete) {
        setSummary(await api("/api/assistant/summary"));
      } else {
        setSummary(null);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    clearPortfolioSessionCache();
    setSession({ user: null, profile: null, income: null });
    setSummary(null);
    setActiveDashboardTab("overview");
  }, []);

  const switchDashboardTab = useCallback((tab) => {
    startTabTransition(() => setActiveDashboardTab(tab));
  }, []);

  const showDashboardShell = Boolean(session.user?.emailVerified && session.user?.onboardingComplete && summary);

  return (
    <main className={`app-shell ${showDashboardShell ? "with-sidebar" : ""}`}>
      {!showDashboardShell && (
        <header className="topbar">
          <div className="topbar-left">
            <div className="brand">
              <div className="brand-mark">
                <Sparkles size={18} />
              </div>
              <span>Finova</span>
            </div>
          </div>
          <div className="top-actions">
            {session.user && (
              <button className="btn secondary" onClick={logout}>
                <LogOut size={17} />
                Logout
              </button>
            )}
          </div>
        </header>
      )}

      <div className={showDashboardShell ? "app-main" : "container"}>
        {message && <div className="alert warn">{message}</div>}
        {loading ? (
          <DashboardSkeleton />
        ) : !session.user ? (
          <Landing onDone={refresh} />
        ) : !session.user.emailVerified ? (
          <Verification user={session.user} onDone={refresh} />
        ) : !session.user.onboardingComplete ? (
          <Onboarding onDone={refresh} />
        ) : (
          <Dashboard user={session.user} summary={summary} activeTab={activeDashboardTab} isTabPending={isTabPending} onTab={switchDashboardTab} onRefresh={refresh} onLogout={logout} onDone={refresh} />
        )}
      </div>
    </main>
  );
}

function Landing({ onDone }) {
  return (
    <div className="hero">
      <section className="hero-copy">
        <h1>Finova</h1>
        <p className="lead">
          A budgeting assistant that allocates income, detects risk, ranks problem categories, and turns spending behavior into specific next actions.
        </p>
        <div className="money-row">
          <span>Essentials first</span>
          <span>Debt-aware plans</span>
          <span>Behavior score</span>
          <span>Gold and silver insights</span>
        </div>
      </section>
      <AuthPanel onDone={onDone} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard skeleton-stack">
      <section className="summary-grid">
        {Array.from({ length: 4 }, (_, index) => <div className="panel metric skeleton-card" key={index} />)}
      </section>
      <div className="panel section skeleton-card tall" />
      <section className="grid-2">
        <div className="panel section skeleton-card chart" />
        <div className="panel section skeleton-card chart" />
      </section>
    </div>
  );
}

function ChartSkeleton({ title }) {
  return (
    <div className="panel section chart-panel">
      <h2>{title}</h2>
      <div className="chart-box skeleton-card" />
    </div>
  );
}

function AuthPanel({ onDone }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("auth=login")) setMode("login");
  }, []);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setForm({ email: form.email, password: "" });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const endpoint = mode === "forgot" ? "/api/auth/forgot-password" : `/api/auth/${mode}`;
      const payload = mode === "forgot" ? { email: form.email } : form;
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      if (mode === "forgot") {
        setNotice(result.message);
        setForm({ email: form.email, password: "" });
        return;
      }
      if (mode === "signup" && !result.user) {
        setNotice(result.message);
        setForm({ ...form, password: "" });
        return;
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "forgot" ? "Recover Password" : mode === "signup" ? "Create secure account" : "Login";

  return (
    <section className="panel auth-panel">
      {mode !== "forgot" ? (
        <div className="tabs">
          <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Signup</button>
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Login</button>
        </div>
      ) : (
        <div className="auth-heading">
          <KeyRound size={20} />
          <div>
            <h2>Forgot Password?</h2>
            <p className="hint">Enter your registered email to receive a secure reset link.</p>
          </div>
        </div>
      )}
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </div>
        {mode !== "forgot" && (
          <div className="field">
            <label>Password</label>
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} value={form.password} minLength={8} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
              <button type="button" className="field-icon-button" title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className="auth-links">
              <button type="button" className="text-link" onClick={() => switchMode("forgot")}>Forgot Password?</button>
            </div>
          </div>
        )}
        {notice && <div className="alert info">{notice}</div>}
        {error && <div className="alert risk">{error}</div>}
        <button className="btn" type="submit" disabled={submitting}>
          {mode === "forgot" ? <Mail size={17} /> : <ShieldCheck size={17} />}
          {submitting ? "Please wait..." : title}
        </button>
        {mode === "forgot" ? (
          <button type="button" className="text-link centered" onClick={() => switchMode("login")}>Back to Login</button>
        ) : (
          <div className="auth-links split">
            <span className="hint">{mode === "signup" ? "Already have an account?" : "Need a new account?"}</span>
            <button type="button" className="text-link" onClick={() => switchMode(mode === "signup" ? "login" : "signup")}>
              {mode === "signup" ? "Back to Login" : "Create account"}
            </button>
          </div>
        )}
        <p className="hint">Authentication is handled by Supabase with secure server-managed sessions.</p>
      </form>
    </section>
  );
}

function Verification({ user, onDone }) {
  const [error, setError] = useState("");

  async function verify() {
    setError("");
    try {
      await api("/api/auth/verify", { method: "POST" });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel section">
      <h2>Email Verification</h2>
      <p className="hint">A verification email was sent to {user.email}. Confirm it from the Supabase email link, then return and refresh your session.</p>
      {error && <div className="alert risk">{error}</div>}
      <button className="btn" onClick={verify}>
        <BadgeCheck size={17} />
        Refresh verification
      </button>
    </section>
  );
}

function Onboarding({ onDone }) {
  const [form, setForm] = useState({
    name: "",
    birthdate: "",
    incomePeriod: "monthly",
    incomeAmount: "",
    savingsGoalAmount: "",
    priority: "saving",
    mode: "professional",
    hasDebt: false,
    debt: {
      name: "",
      originalAmount: "",
      annualInterestRate: "",
      remainingMonths: "",
      amountRepaid: "",
      emiDay: "1",
      goal: "stay_consistent",
    },
    goal: {
      name: "",
      emoji: "*",
      target: "",
      deadline: "",
    },
  });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const normalizedBirthdate = normalizeBirthdateInput(form.birthdate);
    if (!normalizedBirthdate) {
      setError("Enter birthdate in DD/MM/YYYY format.");
      return;
    }
    try {
      await api("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          birthdate: normalizedBirthdate,
          incomeAmount: parseMoneyInput(form.incomeAmount),
          savingsGoalAmount: parseMoneyInput(form.savingsGoalAmount),
          debt: form.hasDebt ? {
            ...form.debt,
            originalAmount: parseMoneyInput(form.debt.originalAmount),
            annualInterestRate: Number(form.debt.annualInterestRate || 0),
            remainingMonths: Number(form.debt.remainingMonths),
            amountRepaid: parseMoneyInput(form.debt.amountRepaid || 0),
            emiDay: Number(form.debt.emiDay),
          } : undefined,
          goal: form.goal.name ? {
            ...form.goal,
            target: parseMoneyInput(form.goal.target),
            deadline: normalizeDisplayDateInput(form.goal.deadline),
          } : undefined,
        }),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="onboarding-shell">
      <div className="onboarding-intro">
        <div className="brand-mark finance-mark"><Activity size={22} /></div>
        <p className="eyebrow">Finova setup</p>
        <h2>Shape your financial workspace.</h2>
        <p className="lead">A few details let Finova build the budget, goals, and alerts around your real month.</p>
      </div>
      <form className="form" onSubmit={submit}>
        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div className="field">
            <label>Birthdate</label>
            <input
              value={formatBirthdateDisplay(form.birthdate)}
              onChange={(event) => setForm({ ...form, birthdate: formatDateTyping(event.target.value) })}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              required
            />
            <p className="hint">Use day / month / year.</p>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Income Period</label>
            <select value={form.incomePeriod} onChange={(event) => setForm({ ...form, incomePeriod: event.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="field">
            <label>Income Amount</label>
            <input value={formatMoneyInput(form.incomeAmount)} inputMode="decimal" onChange={(event) => setForm({ ...form, incomeAmount: formatMoneyInput(event.target.value) })} required />
          </div>
        </div>
        <div className="field">
          <label>{form.incomePeriod === "annual" ? "Annual Savings Goal" : "Monthly Savings Goal"}</label>
          <input
            value={formatMoneyInput(form.savingsGoalAmount)}
            inputMode="decimal"
            onChange={(event) => setForm({ ...form, savingsGoalAmount: formatMoneyInput(event.target.value) })}
            placeholder={form.incomePeriod === "annual" ? "How much do you want to save this year?" : "How much do you want to save each month?"}
            required
          />
          <p className="hint">
            This becomes your default savings target and gives the Savings page a real benchmark instead of only the assistant recommendation.
          </p>
        </div>
        <div className="field">
          <label>Priority</label>
          <div className="segmented three">
            {[
              ["saving", "Saving"],
              ["debt", "Debt reduction"],
              ["lifestyle", "Lifestyle"],
            ].map(([value, label]) => (
              <button type="button" key={value} className={`segment ${form.priority === value ? "active" : ""}`} onClick={() => setForm({ ...form, priority: value })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Profile Mode</label>
          <div className="segmented three">
            {[
              ["student", "Student"],
              ["professional", "Professional"],
              ["family", "Family"],
            ].map(([value, label]) => (
              <button type="button" key={value} className={`segment ${form.mode === value ? "active" : ""}`} onClick={() => setForm({ ...form, mode: value })}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="money-row">
          <input style={{ width: 18, minHeight: 18 }} type="checkbox" checked={form.hasDebt} onChange={(event) => setForm({ ...form, hasDebt: event.target.checked })} />
          I have debt or fixed obligations to prioritize.
        </label>
        {form.hasDebt && (
          <div className="debt-setup">
            <div className="section-heading compact-heading">
              <div>
                <h2>Debt Obligation</h2>
                <p className="hint">Used for EMI reminders, payoff estimates, and debt risk alerts.</p>
              </div>
              <Coins size={20} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Debt Name</label>
                <input value={form.debt.name} onChange={(event) => setForm({ ...form, debt: { ...form.debt, name: event.target.value } })} placeholder="Car loan, education loan..." required={form.hasDebt} />
              </div>
              <div className="field">
                <label>Debt Amount</label>
                <input value={formatMoneyInput(form.debt.originalAmount)} inputMode="decimal" onChange={(event) => setForm({ ...form, debt: { ...form.debt, originalAmount: formatMoneyInput(event.target.value) } })} required={form.hasDebt} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Annual Interest Rate</label>
                <input type="number" min="0" step="0.01" value={form.debt.annualInterestRate} onChange={(event) => setForm({ ...form, debt: { ...form.debt, annualInterestRate: event.target.value } })} placeholder="0" required={form.hasDebt} />
              </div>
              <div className="field">
                <label>Remaining Period</label>
                <input type="number" min="1" value={form.debt.remainingMonths} onChange={(event) => setForm({ ...form, debt: { ...form.debt, remainingMonths: event.target.value } })} placeholder="Months" required={form.hasDebt} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Amount Repaid</label>
                <input value={formatMoneyInput(form.debt.amountRepaid)} inputMode="decimal" onChange={(event) => setForm({ ...form, debt: { ...form.debt, amountRepaid: formatMoneyInput(event.target.value) } })} placeholder="0" required={form.hasDebt} />
              </div>
              <div className="field">
                <label>Monthly EMI Date</label>
                <input type="number" min="1" max="31" value={form.debt.emiDay} onChange={(event) => setForm({ ...form, debt: { ...form.debt, emiDay: event.target.value } })} required={form.hasDebt} />
              </div>
            </div>
            <div className="field">
              <label>Debt Goal</label>
              <div className="segmented three">
                {[
                  ["catch_up", "Catch up"],
                  ["stay_consistent", "Stay consistent"],
                  ["pay_ahead", "Pay ahead"],
                ].map(([value, label]) => (
                  <button type="button" key={value} className={`segment ${form.debt.goal === value ? "active" : ""}`} onClick={() => setForm({ ...form, debt: { ...form.debt, goal: value } })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="debt-setup">
          <div className="section-heading compact-heading">
            <div>
              <h2>First Goal</h2>
              <p className="hint">Optional, but it gives the overview page a useful goal snapshot.</p>
            </div>
            <Target size={20} />
          </div>
          <div className="grid-2 goal-setup-grid">
            <div className="field">
              <label>Goal</label>
              <input value={form.goal.name} onChange={(event) => setForm({ ...form, goal: { ...form.goal, name: event.target.value } })} placeholder="Emergency fund, vacation..." />
            </div>
            <div className="field">
              <label>Emoji</label>
              <input value={form.goal.emoji} onChange={(event) => setForm({ ...form, goal: { ...form.goal, emoji: event.target.value } })} />
              <EmojiPicker value={form.goal.emoji} onChange={(emoji) => setForm({ ...form, goal: { ...form.goal, emoji } })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Target Amount</label>
              <input value={formatMoneyInput(form.goal.target)} inputMode="decimal" onChange={(event) => setForm({ ...form, goal: { ...form.goal, target: formatMoneyInput(event.target.value) } })} />
            </div>
            <div className="field">
              <label>Finish By</label>
              <input value={formatDisplayDateInput(form.goal.deadline)} onChange={(event) => setForm({ ...form, goal: { ...form.goal, deadline: formatDateTyping(event.target.value) } })} placeholder="DD/MM/YYYY" inputMode="numeric" />
            </div>
          </div>
        </div>
        {error && <div className="alert risk">{error}</div>}
        <button className="btn" type="submit">
          <PiggyBank size={17} />
          Generate assistant budget
        </button>
      </form>
    </section>
  );
}

const navItems = [
  ["dashboard", BarChart3, "Dashboard"],
  ["budget", Wallet, "Budget"],
  ["transactions", CreditCard, "Transactions"],
  ["goals", Target, "Goals"],
  ["habits", Zap, "Habits"],
  ["savings", PiggyBank, "Savings"],
  ["analytics", TrendingUp, "Analytics"],
  ["investments", TrendingDown, "Investments"],
  ["assistant", Sparkles, "AI Assistant"],
  ["settings", Settings, "Settings"],
];

const Dashboard = memo(function Dashboard({ user, summary, activeTab, isTabPending, onTab, onRefresh, onLogout, onDone }) {
  if (!summary) return null;
  const { profile, income, categories, ranking, recommendations, health, alerts, metals, streak, habits, transactions, debtObligations, emiReminders, goals = [], savingsTargets = [], customHabits = [], totals, savingsGuidance, analytics } = summary;
  const dashboardMonths = useMemo(() => {
    if (analytics?.dashboardMonths?.length) return analytics.dashboardMonths;
    const fallbackKey = monthKeyFromDate(new Date());
    return [{
      key: fallbackKey,
      label: monthLabelFromKey(fallbackKey),
      shortLabel: monthLabelFromKey(fallbackKey),
      categories,
      totals: totals || { credits: 0, expenses: 0, income: income.monthlyIncome, netBalance: income.monthlyIncome },
    }];
  }, [analytics?.dashboardMonths, categories, income.monthlyIncome, totals]);
  const [dashboardMonthIndex, setDashboardMonthIndex] = useState(() => Math.max(0, dashboardMonths.length - 1));

  useEffect(() => {
    setDashboardMonthIndex(Math.max(0, dashboardMonths.length - 1));
  }, [dashboardMonths]);

  const selectedDashboardMonth = dashboardMonths[Math.min(dashboardMonthIndex, Math.max(0, dashboardMonths.length - 1))]
    || dashboardMonths[dashboardMonths.length - 1]
    || null;
  const dashboardCategories = selectedDashboardMonth?.categories || categories;
  const activeDashboardMonthLabel = selectedDashboardMonth?.label || monthLabelFromKey(monthKeyFromDate(new Date())) || "This month";
  const chartData = useMemo(() => dashboardCategories.map((category) => ({
    name: category.label.replace(" / ", " "),
    Actual: category.spent,
    Expected: category.expected,
    Limit: category.monthlyLimit,
    type: category.type,
  })), [dashboardCategories]);
  const pieData = useMemo(() => dashboardCategories
    .filter((category) => Number(category.spent || 0) > 0 || Number(category.monthlyLimit || 0) > 0)
    .map((category) => ({
    name: category.label,
    value: category.monthlyLimit,
    spent: category.spent,
    type: category.type,
    color: category.color || categoryColors[category.type],
    percent: selectedDashboardMonth?.totals?.expenses > 0
      ? (Number(category.spent || 0) / selectedDashboardMonth.totals.expenses) * 100
      : income.monthlyIncome
        ? (category.monthlyLimit / income.monthlyIncome) * 100
        : 0,
  })), [dashboardCategories, income.monthlyIncome, selectedDashboardMonth]);
  const activeLabel = navItems.find(([key]) => key === activeTab)?.[2] || "Overview";
  const [overlayMessagesByPage, setOverlayMessagesByPage] = useState({});
  const [overlayDraft, setOverlayDraft] = useState("");
  const [overlayError, setOverlayError] = useState("");
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [assistantSourcePage, setAssistantSourcePage] = useState("dashboard");
  const [assistantOverlayOpen, setAssistantOverlayOpen] = useState(false);
  const [assistantConversations, setAssistantConversations] = useState([]);
  const [assistantConversationId, setAssistantConversationId] = useState("");
  const [assistantPageMessages, setAssistantPageMessages] = useState([]);
  const [assistantPageDraft, setAssistantPageDraft] = useState("");
  const [assistantPageError, setAssistantPageError] = useState("");
  const [assistantPageLoading, setAssistantPageLoading] = useState(false);
  const [assistantIsStartingNew, setAssistantIsStartingNew] = useState(false);

  const overlayMessages = overlayMessagesByPage[assistantSourcePage] || [];
  const activeConversation = useMemo(
    () => assistantConversations.find((conversation) => conversation.id === assistantConversationId) || null,
    [assistantConversationId, assistantConversations],
  );

  useEffect(() => {
    if (activeTab !== "assistant") setAssistantSourcePage(activeTab);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssistantConversations() {
      try {
        const result = await api("/api/assistant/conversations");
        if (cancelled) return;
        const conversations = result.conversations || [];
        setAssistantConversations(conversations);
        if (!assistantConversationId && !assistantIsStartingNew && conversations[0]) {
          setAssistantConversationId(conversations[0].id);
          setAssistantPageMessages(conversations[0].messages || []);
        }
      } catch {
        if (!cancelled) setAssistantConversations([]);
      }
    }

    loadAssistantConversations();
    return () => {
      cancelled = true;
    };
  }, [assistantConversationId, assistantIsStartingNew]);

  async function persistAssistantConversation(messages) {
    const title = assistantConversationTitle(messages.find((message) => message.role === "user")?.content || "New Chat");
    if (!assistantConversationId) {
      const result = await api("/api/assistant/conversations", {
        method: "POST",
        body: JSON.stringify({
          title,
          sourcePage: "assistant",
          messages,
        }),
      });
      const conversation = result.conversation;
      setAssistantConversationId(conversation.id);
      setAssistantIsStartingNew(false);
      setAssistantConversations((current) => [conversation, ...current]);
      return conversation;
    }

    const result = await api("/api/assistant/conversations", {
      method: "PATCH",
      body: JSON.stringify({
        id: assistantConversationId,
        title,
        sourcePage: "assistant",
        messages,
      }),
    });
    const conversation = result.conversation;
    setAssistantIsStartingNew(false);
    setAssistantConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
    return conversation;
  }

  async function sendOverlayMessage(text) {
    const content = text.trim();
    if (!content || overlayLoading) return;
    const nextMessages = [...overlayMessages, assistantMessage("user", content)];
    setOverlayMessagesByPage((current) => ({ ...current, [assistantSourcePage]: nextMessages }));
    setOverlayDraft("");
    setOverlayError("");
    setOverlayLoading(true);
    try {
      const result = await api("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          page: assistantSourcePage || "dashboard",
          messages: nextMessages,
        }),
      });
      setOverlayMessagesByPage((current) => ({
        ...current,
        [assistantSourcePage]: [...(current[assistantSourcePage] || nextMessages), assistantMessage("assistant", result.reply, result.modelUsed)],
      }));
    } catch (error) {
      setOverlayError(error.message);
    } finally {
      setOverlayLoading(false);
    }
  }

  async function sendAssistantPageMessage(text) {
    const content = text.trim();
    if (!content || assistantPageLoading) return;
    const nextMessages = [...assistantPageMessages, assistantMessage("user", content)];
    setAssistantPageMessages(nextMessages);
    setAssistantPageDraft("");
    setAssistantPageError("");
    setAssistantPageLoading(true);
    try {
      const result = await api("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          page: "assistant",
          messages: nextMessages,
        }),
      });
      const finalMessages = [...nextMessages, assistantMessage("assistant", result.reply, result.modelUsed)];
      setAssistantPageMessages(finalMessages);
      await persistAssistantConversation(finalMessages);
    } catch (error) {
      setAssistantPageError(error.message);
    } finally {
      setAssistantPageLoading(false);
    }
  }

  function openAssistant() {
    setOverlayError("");
    setAssistantOverlayOpen(true);
  }

  function closeAssistantOverlay() {
    setAssistantOverlayOpen(false);
  }

  function selectAssistantConversation(conversation) {
    setAssistantConversationId(conversation.id);
    setAssistantIsStartingNew(false);
    setAssistantPageMessages(conversation.messages || []);
    setAssistantPageError("");
  }

  function startNewAssistantConversation() {
    setAssistantIsStartingNew(true);
    setAssistantConversationId("");
    setAssistantPageMessages([]);
    setAssistantPageDraft("");
    setAssistantPageError("");
  }

  if (activeTab === "overview") {
    return (
      <div className={`standalone-overview tab-panel ${isTabPending ? "pending" : ""}`}>
        <OverviewPage profile={profile} income={income} health={health} alerts={alerts} recommendations={recommendations} goals={goals} savingsGuidance={savingsGuidance} onTab={onTab} />
        <button className="assistant-fab" type="button" onClick={openAssistant}>
          <Sparkles size={18} />
          <span>Chat with AI Assistant</span>
        </button>
        {assistantOverlayOpen && (
          <AssistantOverlay
            messages={overlayMessages}
            draft={overlayDraft}
            error={overlayError}
            loading={overlayLoading}
            pageContext={assistantSourcePage}
            onDraftChange={setOverlayDraft}
            onSubmit={sendOverlayMessage}
            onClose={closeAssistantOverlay}
          />
        )}
      </div>
    );
  }

  return (
    <div className="finance-layout">
      <aside className="side-rail">
        <div className="side-brand">
          <div className="brand-mark finance-mark"><Activity size={22} /></div>
          <div>
            <strong>Finova AI</strong>
            <span>Smart budgeting</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Dashboard pages">
          {navItems.map(([key, Icon, label]) => (
            <button key={key} className={`side-nav-item ${activeTab === key ? "active" : ""}`} onClick={() => onTab(key)}>
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="workspace-topbar">
          <button className="btn secondary icon sidebar-menu" type="button" title="Menu"><Menu size={18} /></button>
          <div className="workspace-title-block">
            <h1>{activeLabel}</h1>
            <p className="hint">{activeTab === "dashboard" ? `${profile.name}'s financial workspace | ${activeDashboardMonthLabel}` : `${profile.name}'s financial workspace`}</p>
          </div>
          <div className="top-actions">
            <button className="btn secondary icon" title="Refresh dashboard" onClick={onRefresh}><RefreshCcw size={17} /></button>
            <button className="avatar-button" title={user.email} onClick={() => onTab("settings")}><User size={17} /></button>
            <button className="btn secondary" onClick={onLogout}><LogOut size={17} />Logout</button>
          </div>
        </header>
        <div className={`tab-panel ${isTabPending ? "pending" : ""}`}>
          {activeTab === "dashboard" && (
            <DashboardPage
              categories={dashboardCategories}
              chartData={chartData}
              pieData={pieData}
              health={health}
              activeMonthLabel={activeDashboardMonthLabel}
              canGoPrevious={dashboardMonthIndex > 0}
              canGoNext={dashboardMonthIndex < dashboardMonths.length - 1}
              onPreviousMonth={() => setDashboardMonthIndex((current) => Math.max(0, current - 1))}
              onNextMonth={() => setDashboardMonthIndex((current) => Math.min(dashboardMonths.length - 1, current + 1))}
            />
          )}
          {activeTab === "budget" && <BudgetPage income={income} categories={categories} hasDebt={profile.hasDebt} savingsGuidance={savingsGuidance} recommendations={recommendations} onDone={onDone} />}
          {activeTab === "transactions" && <TransactionsPage transactions={transactions || []} categories={categories} goals={goals} emiReminders={emiReminders || []} totals={totals} income={income} onDone={onDone} />}
          {activeTab === "goals" && <GoalsPage goals={goals} onDone={onDone} />}
          {activeTab === "habits" && <HabitsPage customHabits={customHabits} habits={habits} categories={categories} goals={goals} savingsTargets={savingsTargets} transactions={transactions} income={income} onDone={onDone} />}
          {activeTab === "savings" && <SavingsPage savingsTargets={savingsTargets} savingsGuidance={savingsGuidance} income={income} goals={goals} transactions={transactions || []} onDone={onDone} />}
          {activeTab === "analytics" && <AnalyticsPage categories={categories} transactions={transactions || []} health={health} income={income} savingsGuidance={savingsGuidance} goals={goals} analytics={analytics} />}
          {activeTab === "investments" && <InvestmentsPage />}
          {activeTab === "assistant" && (
            <AssistantPage
              conversations={assistantConversations}
              conversation={activeConversation}
              messages={assistantPageMessages}
              draft={assistantPageDraft}
              error={assistantPageError}
              loading={assistantPageLoading}
              onDraftChange={setAssistantPageDraft}
              onSubmit={sendAssistantPageMessage}
              onSelectConversation={selectAssistantConversation}
              onNewConversation={startNewAssistantConversation}
            />
          )}
          {activeTab === "settings" && <SettingsPage user={user} profile={profile} income={income} onDone={onDone} />}
        </div>
        {activeTab !== "assistant" && (
          <button className="assistant-fab" type="button" onClick={openAssistant}>
            <Sparkles size={18} />
            <span>Chat with AI Assistant</span>
          </button>
        )}
        {assistantOverlayOpen && (
          <AssistantOverlay
            messages={overlayMessages}
            draft={overlayDraft}
            error={overlayError}
            loading={overlayLoading}
            pageContext={assistantSourcePage}
            onDraftChange={setOverlayDraft}
            onSubmit={sendOverlayMessage}
            onClose={closeAssistantOverlay}
          />
        )}
      </section>
    </div>
  );
});

const TransactionsPage = memo(function TransactionsPage({ transactions, categories, goals = [], emiReminders, totals, income, onDone }) {
  const indiaToday = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    return `${year}-${month}-${day}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => monthKeyFromDate(new Date(`${indiaToday}T12:00:00+05:30`)));
  const visible = selectedDate ? transactions.filter((transaction) => transaction.date === selectedDate) : transactions;
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => String(transaction.date || "").slice(0, 7) === visibleMonth),
    [transactions, visibleMonth],
  );
  const monthCredits = monthTransactions.filter((transaction) => transaction.categoryType === "credit").reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const totalExpenses = monthTransactions.filter((transaction) => transaction.categoryType !== "credit").reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const baseIncome = Number(income?.monthlyIncome || 0);
  const totalIncome = baseIncome + monthCredits;
  const netBalance = totalIncome - totalExpenses;
  const activeMonthLabel = monthLabelFromKey(visibleMonth) || "this month";

  return (
    <div className="dashboard-page">
      <section className="transactions-top">
        <HabitCalendar
          habits={[]}
          transactions={transactions}
          emiReminders={emiReminders}
          selectedDate={selectedDate || indiaToday}
          visibleMonth={visibleMonth}
          onSelectDate={(date) => {
            setSelectedDate(date);
            if (date) setVisibleMonth(String(date).slice(0, 7));
          }}
          onVisibleMonthChange={setVisibleMonth}
        />
        <TransactionForm categories={categories} goals={goals} selectedDate={selectedDate} onDone={onDone} />
      </section>
      <section className="summary-grid three">
        <Metric icon={<TrendingUp size={19} />} label="Total Income" value={formatMoney(totalIncome)} hint={activeMonthLabel} valueClassName="transaction-income-value" />
        <Metric icon={<TrendingDown size={19} />} label="Total Expenses" value={formatMoney(totalExpenses)} hint={activeMonthLabel} valueClassName="transaction-expense-value" />
        <Metric icon={<Activity size={19} />} label="Net Balance" value={formatMoney(netBalance)} hint={activeMonthLabel} valueClassName="transaction-balance-value" />
      </section>
      <section className="panel section">
        <div className="section-heading">
          <div><h2>Transaction List</h2><p className="hint">{selectedDate ? `Showing ${selectedDate}` : "Showing every transaction"}</p></div>
          {selectedDate && <button className="btn secondary" type="button" onClick={() => setSelectedDate("")}>Show all</button>}
        </div>
        <div className="transaction-edit-list">
          {visible.length ? visible.map((transaction) => <EditableTransaction key={transaction.id} transaction={transaction} categories={categories} goals={goals} onDone={onDone} />) : <div className="empty-state">No transactions found.</div>}
        </div>
      </section>
    </div>
  );
});

const GoalsPage = memo(function GoalsPage({ goals, onDone }) {
  const [form, setForm] = useState({ name: "", emoji: "💰", target: "", current: "0", deadline: "", priority: "medium" });
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      setInsightsLoading(true);
      setInsightsError("");
      try {
        const result = await api("/api/assistant/insights", {
          method: "POST",
          body: JSON.stringify({ page: "goals" }),
        });
        if (!cancelled) setAiInsights(result.insights || []);
      } catch (err) {
        if (!cancelled) {
          setAiInsights([]);
          setInsightsError(err.message);
        }
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [goals]);

  async function addGoal(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          target: parseMoneyInput(form.target),
          current: parseMoneyInput(form.current),
          deadline: normalizeDisplayDateInput(form.deadline),
        }),
      });
      setForm({ name: "", emoji: "💰", target: "", current: "0", deadline: "", priority: "medium" });
      setComposerOpen(false);
      await onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard-page goals-page">
      <section className="panel section goals-header-panel">
        <div className="section-heading goals-heading">
          <div>
            <h2>Financial Goals</h2>
            <p className="hint">Track your progress toward important money targets.</p>
          </div>
          <button className="btn" type="button" onClick={() => setComposerOpen((current) => !current)}>
            <Plus size={17} />
            {composerOpen ? "Close" : "Add Goal"}
          </button>
        </div>
        {composerOpen && (
          <form className="goal-composer" onSubmit={addGoal}>
            <div className="goal-composer-grid">
              <input placeholder="Goal" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <button type="button" className="goal-emoji-trigger" aria-label="Selected emoji">
                <span>{form.emoji}</span>
              </button>
              <input placeholder="Target Amount" value={formatMoneyInput(form.target)} inputMode="decimal" onChange={(event) => setForm({ ...form, target: formatMoneyInput(event.target.value) })} required />
              <input value={formatDisplayDateInput(form.deadline)} onChange={(event) => setForm({ ...form, deadline: formatDateTyping(event.target.value) })} placeholder="DD/MM/YYYY" inputMode="numeric" required />
              <button className="btn goal-submit" type="submit"><Plus size={17} />Add Goal</button>
            </div>
            <EmojiPicker value={form.emoji} onChange={(emoji) => setForm({ ...form, emoji })} />
          </form>
        )}
        {error && <div className="alert risk">{error}</div>}
      </section>
      <section className={`goal-grid ${goals.length === 1 ? "single-goal" : ""}`}>
        {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onDone={onDone} />)}
      </section>
      <AIInsightsPanel insights={aiInsights} loading={insightsLoading} error={insightsError} />
    </div>
  );
});

function EmojiPicker({ value, onChange }) {
  return (
    <div className="emoji-picker" aria-label="Suggested goal icons">
      {goalEmojiOptions.map((emoji) => (
        <button
          type="button"
          key={emoji}
          className={`emoji-option ${value === emoji ? "active" : ""}`}
          onClick={() => onChange(emoji)}
          aria-label={`Use ${emoji} as goal icon`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function GoalCard({ goal, onDone }) {
  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(`${goal.deadline}T12:00:00`) - new Date()) / 86400000));
  const amountLeft = Math.max(0, Number(goal.target || 0) - Number(goal.current || 0));
  const accent = goalAccent(goal);
  async function remove() {
    await api("/api/goals", { method: "DELETE", body: JSON.stringify({ id: goal.id }) });
    await onDone();
  }
  return (
    <article className="panel section goal-card">
      <div className="section-heading goal-card-heading">
        <div className="goal-title">
          <span>{goal.emoji}</span>
          <div>
            <h2>{goal.name}</h2>
            <span className={`goal-priority ${accent.badge}`}>{String(goal.priority || "medium").toUpperCase()}</span>
          </div>
        </div>
        <button className="btn secondary icon danger" onClick={remove} title="Delete goal"><Trash2 size={16} /></button>
      </div>
      <div className="goal-progress-head">
        <span>Progress</span>
        <strong style={{ color: accent.color }}>{progress}%</strong>
      </div>
      <div className="bar large goal-progress-bar">
        <span style={{ width: `${progress}%`, background: accent.color, boxShadow: "none" }} />
      </div>
      <div className="goal-amount-grid">
        <div>
          <span className="hint">Current</span>
          <strong>{formatMoney(goal.current)}</strong>
        </div>
        <div>
          <span className="hint">Target</span>
          <strong>{formatMoney(goal.target)}</strong>
        </div>
      </div>
      <div className="goal-footer-row">
        <span className="hint">{daysLeft} days left</span>
        <strong style={{ color: accent.color }}>{formatMoney(amountLeft)} to go</strong>
      </div>
    </article>
  );
}

const HabitsPage = memo(function HabitsPage({ customHabits, habits, categories, goals = [], savingsTargets = [], transactions = [], income, onDone }) {
  const [form, setForm] = useState({ name: "", description: "", icon: "*", cadence: "daily", targetDays: 30 });
  const [showComposer, setShowComposer] = useState(false);
  const completedToday = customHabits.filter((habit) => habit.completedToday).length;
  const totalStreak = customHabits.reduce((sum, habit) => sum + Number(habit.streak || 0), 0);
  const bestStreak = customHabits.reduce((best, habit) => Math.max(best, Number(habit.bestStreak || habit.streak || 0)), 0);
  const completionRate = customHabits.length ? Math.round((completedToday / customHabits.length) * 100) : 0;
  const weeklyHabits = customHabits.filter((habit) => habit.cadence === "weekly");
  const monthlySavingsTarget = Number(savingsTargets[0]?.monthlyContribution || income?.monthlyIncome * 0.2 || 0);
  const monthKey = useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value || String(now.getFullYear());
    const month = parts.find((part) => part.type === "month")?.value || String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);
  const savingsThisMonth = useMemo(() => transactions
    .filter((transaction) => transaction.date?.startsWith(monthKey))
    .filter((transaction) => transaction.categoryType === "savings" || transaction.goalId || isGoalCategoryType(transaction.categoryType))
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0), [monthKey, transactions]);
  const goalContributionCount = useMemo(() => transactions
    .filter((transaction) => transaction.date?.startsWith(monthKey))
    .filter((transaction) => transaction.goalId || isGoalCategoryType(transaction.categoryType)).length, [monthKey, transactions]);
  const overBudgetCount = categories.filter((category) => category.status === "red").length;
  const activeGoals = goals.filter((goal) => Number(goal.target || 0) > Number(goal.current || 0));

  const dailyFocus = useMemo(() => {
    const urgentGoal = activeGoals
      .map((goal) => {
        const deadline = goal.deadline ? new Date(`${goal.deadline}T12:00:00`) : null;
        const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000)) : null;
        const amountLeft = Math.max(0, Number(goal.target || 0) - Number(goal.current || 0));
        return { goal, daysLeft, amountLeft };
      })
      .filter((item) => item.daysLeft !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0];
    const lifestyleRisk = categories.find((category) => category.type === "lifestyle" && ["orange", "red"].includes(category.status));
    if (urgentGoal && urgentGoal.daysLeft <= 30) {
      return {
        title: `Prioritize ${urgentGoal.goal.name}`,
        summary: `${formatMoney(urgentGoal.amountLeft)} still left with ${urgentGoal.daysLeft} day${urgentGoal.daysLeft === 1 ? "" : "s"} remaining.`,
        chip: `${Math.max(urgentGoal.daysLeft, 0)} days left`,
        tone: "green",
      };
    }
    if (monthlySavingsTarget > 0 && savingsThisMonth < monthlySavingsTarget) {
      return {
        title: "Protect this month's savings pace",
        summary: `${formatMoney(Math.max(0, monthlySavingsTarget - savingsThisMonth))} still needed to hit your monthly savings target.`,
        chip: `${formatMoney(savingsThisMonth)} saved`,
        tone: "purple",
      };
    }
    if (lifestyleRisk) {
      return {
        title: "Tighten discretionary spending",
        summary: `${lifestyleRisk.label} is drifting off plan. Logging impulse purchases today will help contain the month.`,
        chip: lifestyleRisk.status === "red" ? "Over budget" : "Watch closely",
        tone: "orange",
      };
    }
    if (customHabits.some((habit) => !habit.completedToday)) {
      return {
        title: "Finish your habit set",
        summary: `${customHabits.length - completedToday} habit${customHabits.length - completedToday === 1 ? "" : "s"} still open today. Closing them keeps the streak intact.`,
        chip: `${completedToday}/${customHabits.length} done`,
        tone: "blue",
      };
    }
    return {
      title: "Momentum looks clean",
      summary: "Your current budget, savings, and goal signals are stable. Use today to keep the routine consistent.",
      chip: "On track",
      tone: "green",
    };
  }, [activeGoals, categories, completedToday, customHabits, monthlySavingsTarget, savingsThisMonth]);

  const templateHabits = useMemo(() => {
    const templates = [
      { key: "log-spend", icon: "📊", name: "Daily budget tracking", description: "Review and log every spend before the day closes.", cadence: "daily", targetDays: 30 },
      { key: "save-first", icon: "💰", name: "Save before spending", description: "Move money into savings or a goal before discretionary purchases.", cadence: "daily", targetDays: 20 },
      { key: "weekly-review", icon: "🛡️", name: "Weekly budget review", description: "Review category drift and adjust your next few days.", cadence: "weekly", targetDays: 12 },
    ];
    if (overBudgetCount > 0) {
      templates[0] = { key: "impulse-check", icon: "🛑", name: "No impulse purchases", description: "Pause any unplanned purchase until you re-check the category limit.", cadence: "daily", targetDays: 21 };
    }
    if (activeGoals.length) {
      templates[1] = { key: "goal-transfer", icon: activeGoals[0].emoji || "🎯", name: `Fund ${activeGoals[0].name}`, description: `Add a small transfer toward ${activeGoals[0].name} on every savings day.`, cadence: "daily", targetDays: 18 };
    }
    return templates.filter((template) => !customHabits.some((habit) => habit.name.toLowerCase() === template.name.toLowerCase()));
  }, [activeGoals, customHabits, overBudgetCount]);

  const achievements = useMemo(() => {
    const budgetGreen = categories.length > 0 && categories.every((category) => category.status !== "red");
    const topGoal = goals.reduce((best, goal) => {
      const currentRatio = Number(goal.target || 0) > 0 ? Number(goal.current || 0) / Number(goal.target || 1) : 0;
      const bestRatio = Number(best?.target || 0) > 0 ? Number(best.current || 0) / Number(best.target || 1) : -1;
      return currentRatio > bestRatio ? goal : best;
    }, null);
    return [
      {
        key: "streak7",
        icon: "🌱",
        title: "Budget Beginner",
        detail: "Any habit reaches a 7-day streak",
        unlocked: bestStreak >= 7,
        accent: "green",
      },
      {
        key: "savingstar",
        icon: "⭐",
        title: "Saving Star",
        detail: monthlySavingsTarget > 0 ? `Save at least ${formatMoney(Math.round(monthlySavingsTarget * 0.75))} this month` : "Set a monthly savings target",
        unlocked: monthlySavingsTarget > 0 && savingsThisMonth >= monthlySavingsTarget * 0.75,
        accent: "purple",
      },
      {
        key: "goalgetter",
        icon: "🎯",
        title: "Goal Getter",
        detail: topGoal ? `Push ${topGoal.name} past the early progress line` : "Start funding one savings goal",
        unlocked: goals.some((goal) => Number(goal.target || 0) > 0 && Number(goal.current || 0) / Number(goal.target || 1) >= 0.25),
        accent: "orange",
      },
      {
        key: "smartspender",
        icon: "🧠",
        title: "Smart Spender",
        detail: "Keep all tracked categories out of the red zone",
        unlocked: budgetGreen,
        accent: "blue",
      },
      {
        key: "transfermode",
        icon: "💸",
        title: "Transfer Mode",
        detail: "Record at least 3 savings or goal contributions this month",
        unlocked: goalContributionCount >= 3,
        accent: "green",
      },
      {
        key: "consistency",
        icon: "🏆",
        title: "Consistency Mode",
        detail: weeklyHabits.length ? "Hit every weekly cadence habit this week" : "Complete at least 75% of your active habits today",
        unlocked: weeklyHabits.length ? weeklyHabits.every((habit) => Number(habit.thisWeekCompletions || 0) > 0) : (customHabits.length > 0 && completionRate >= 75),
        accent: "purple",
      },
    ];
  }, [bestStreak, completionRate, customHabits.length, categories, goalContributionCount, goals, monthlySavingsTarget, savingsThisMonth, weeklyHabits]);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;

  async function addHabit(event) {
    event.preventDefault();
    await api("/api/custom-habits", { method: "POST", body: JSON.stringify(form) });
    setForm({ name: "", description: "", icon: "*", cadence: "daily", targetDays: 30 });
    setShowComposer(false);
    await onDone();
  }

  async function addTemplateHabit(template) {
    await api("/api/custom-habits", { method: "POST", body: JSON.stringify(template) });
    await onDone();
  }

  async function toggle(habit) {
    await api("/api/custom-habits", { method: "PATCH", body: JSON.stringify({ ...habit, completedToday: !habit.completedToday }) });
    await onDone();
  }

  async function removeHabit(id) {
    await api("/api/custom-habits", { method: "DELETE", body: JSON.stringify({ id }) });
    await onDone();
  }

  return (
    <div className="dashboard-page habits-workspace">
      <section className="summary-grid three habits-summary-grid">
        <div className="panel metric habit-metric gradient-orange">
          <div className="row-title"><FlameIcon /><span>Total Streak</span></div>
          <div className="metric-value">{totalStreak}</div>
          <p>{bestStreak ? `Best streak ${bestStreak} days` : "Start your first streak"}</p>
        </div>
        <div className="panel metric habit-metric gradient-purple">
          <div className="row-title"><Check size={19} /><span>Completed Today</span></div>
          <div className="metric-value">{customHabits.length ? `${completedToday}/${customHabits.length}` : "0/0"}</div>
          <p>{customHabits.length ? `${completionRate}% completion rate` : "Add a habit to begin tracking"}</p>
        </div>
        <div className="panel metric habit-metric gradient-green">
          <div className="row-title"><Medal size={19} /><span>Achievements</span></div>
          <div className="metric-value">{`${unlockedAchievements}/${achievements.length}`}</div>
          <p>{goalContributionCount} goal-linked savings logs this month</p>
        </div>
      </section>

      <section className="habits-top-grid">
        <article className={`panel section habits-focus-card ${dailyFocus.tone}`}>
          <div className="section-header">
            <div>
              <span className="eyebrow">Smart focus</span>
              <h2>{dailyFocus.title}</h2>
            </div>
            <span className={`badge ${dailyFocus.tone}`}>{dailyFocus.chip}</span>
          </div>
          <p className="hint">{dailyFocus.summary}</p>
          <div className="habits-focus-stats">
            <div>
              <span className="hint">Monthly savings pace</span>
              <strong>{monthlySavingsTarget > 0 ? `${formatMoney(savingsThisMonth)} / ${formatMoney(monthlySavingsTarget)}` : "No target set"}</strong>
            </div>
            <div>
              <span className="hint">Goal activity</span>
              <strong>{goalContributionCount} contributions this month</strong>
            </div>
            <div>
              <span className="hint">Budget pressure</span>
              <strong>{overBudgetCount ? `${overBudgetCount} category${overBudgetCount === 1 ? "" : "ies"} over` : "Stable"}</strong>
            </div>
          </div>
        </article>

        <article className="panel section habits-templates-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Quick start</span>
              <h2>Habit templates</h2>
            </div>
            <button className="btn secondary" type="button" onClick={() => setShowComposer((value) => !value)}>
              <Plus size={16} />
              {showComposer ? "Close" : "Add habit"}
            </button>
          </div>
          <div className="habits-template-list">
            {templateHabits.length ? templateHabits.slice(0, 3).map((template) => (
              <div className="habit-template-card" key={template.key}>
                <span className="habit-template-icon">{template.icon}</span>
                <div>
                  <strong>{template.name}</strong>
                  <p className="hint">{template.description}</p>
                </div>
                <button className="btn secondary" type="button" onClick={() => addTemplateHabit(template)}>Use</button>
              </div>
            )) : (
              <div className="habit-template-card empty">
                <div>
                  <strong>Your core templates are already active</strong>
                  <p className="hint">Add a custom habit below if you want a more specific routine.</p>
                </div>
              </div>
            )}
          </div>
          {showComposer && (
            <form className="habits-composer" onSubmit={addHabit}>
              <div className="habits-composer-grid">
                <input placeholder="Habit name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <input placeholder="Icon" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value.slice(0, 4) })} />
                <select value={form.cadence} onChange={(event) => setForm({ ...form, cadence: event.target.value })}>
                  <option value="daily">Daily cadence</option>
                  <option value="weekly">Weekly cadence</option>
                </select>
                <input type="number" min="1" max="365" value={form.targetDays} onChange={(event) => setForm({ ...form, targetDays: Number(event.target.value) })} />
              </div>
              <input placeholder="Describe the behavior you want to repeat" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <button className="btn" type="submit"><Plus size={17} />Save habit</button>
            </form>
          )}
        </article>
      </section>

      <section className="panel section habits-main-panel">
        <div className="section-header">
          <div>
            <h2>Today's Habits</h2>
            <p className="hint">Track the routines that actually move your budget, savings, and goals.</p>
          </div>
          <span className="badge green">{customHabits.length || 0} active</span>
        </div>
        <div className="habits-today-list">
          {customHabits.length ? customHabits.map((habit) => {
            const progress = habit.targetDays > 0 ? Math.min(100, Math.round((Number(habit.streak || 0) / Number(habit.targetDays || 1)) * 100)) : 0;
            return (
              <article className={`habit-card ${habit.completedToday ? "completed" : ""}`} key={habit.id}>
                <div className="habit-card-main">
                  <span className="habit-card-icon">{habit.icon}</span>
                  <div className="habit-card-copy">
                    <div className="habit-card-title-row">
                      <div>
                        <strong>{habit.name}</strong>
                        <p className="hint">{habit.description || "Stay consistent with this financial behavior."}</p>
                      </div>
                      <div className="habit-card-actions">
                        <button className={`habit-toggle ${habit.completedToday ? "done" : ""}`} type="button" onClick={() => toggle(habit)} aria-label={habit.completedToday ? "Mark as incomplete" : "Mark as complete"}>
                          {habit.completedToday ? <Check size={18} /> : <X size={18} />}
                        </button>
                        <button className="habit-delete" type="button" onClick={() => removeHabit(habit.id)} aria-label="Delete habit">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="habit-card-meta">
                      <span className={`badge ${habit.cadence === "weekly" ? "purple" : "blue"}`}>{habit.cadence === "weekly" ? "Weekly" : "Daily"}</span>
                      <span><Zap size={14} /> {habit.streak} {habit.cadence === "weekly" ? "week" : "day"} streak</span>
                      <span>Best {habit.bestStreak || habit.streak || 0} {habit.cadence === "weekly" ? "weeks" : "days"}</span>
                      <span>Target {habit.targetDays} {habit.cadence === "weekly" ? "weeks" : "days"}</span>
                    </div>
                    <div className="habit-progress-row">
                      <div className="habit-progress-track">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="habit-card-foot">
                      <span className="hint">
                        {habit.cadence === "weekly"
                          ? `${habit.thisWeekCompletions || 0} completions this week | ${habit.missedWindows || 0} missed weeks in the last 8`
                          : `${habit.streak}/${habit.targetDays} days toward this cycle | ${habit.missedWindows || 0} missed days in the last 14`}
                      </span>
                      <strong>{habit.completedToday ? "Completed today" : (habit.lastCompletedAt ? `Last done ${formatShortIndiaDate(habit.lastCompletedAt)}` : "Still open today")}</strong>
                    </div>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="habit-empty-state">
              <span className="habit-card-icon">✨</span>
              <div>
                <strong>No habits tracked yet</strong>
                <p className="hint">Start with a template or add one routine you want to repeat each day or week.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel section habits-achievements-panel">
        <div className="section-header">
          <div>
            <h2>Achievements</h2>
            <p className="hint">These unlock from your real budget, savings, goals, and habit activity.</p>
          </div>
          <span className="badge purple">{unlockedAchievements} unlocked</span>
        </div>
        <div className="habits-achievements-grid">
          {achievements.map((achievement) => (
            <article className={`habit-achievement-card ${achievement.unlocked ? `earned ${achievement.accent}` : ""}`} key={achievement.key}>
              <span className="habit-achievement-icon">{achievement.icon}</span>
              <div>
                <strong>{achievement.title}</strong>
                <p className="hint">{achievement.detail}</p>
                <span className={`badge ${achievement.unlocked ? achievement.accent : "neutral"}`}>{achievement.unlocked ? "Unlocked" : "In progress"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
});

function FlameIcon() {
  return <Zap size={19} />;
}

const SavingsPage = memo(function SavingsPage({ savingsTargets, savingsGuidance, income, goals = [], transactions = [], onDone }) {
  const [form, setForm] = useState({ name: "", target: "", current: "0", monthlyContribution: String(savingsGuidance?.recommendedMonthlySavings || 0), deadline: "" });
  const primarySavingsTarget = savingsTargets[0] || null;
  const monthlyTarget = Number(primarySavingsTarget?.monthlyContribution || savingsGuidance?.recommendedMonthlySavings || 0);
  const now = useMemo(() => new Date(), []);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const savedThisMonth = useMemo(() => transactions
    .filter((transaction) => transaction.date?.startsWith(currentMonthKey))
    .filter((transaction) => transaction.categoryType === "savings" || transaction.goalId || String(transaction.categoryType || "").startsWith("goal:"))
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0), [currentMonthKey, transactions]);
  const savingsGap = Math.max(0, monthlyTarget - savedThisMonth);
  const projectedMonthEnd = dayOfMonth > 0 ? Math.round((savedThisMonth / dayOfMonth) * daysInMonth) : savedThisMonth;
  const requiredDaily = savingsGap > 0 ? Math.round(savingsGap / Math.max(1, daysInMonth - dayOfMonth + 1)) : 0;
  const splitAcrossGoals = useMemo(() => {
    const activeGoals = goals
      .map((goal) => {
        const target = Number(goal.target || 0);
        const current = Number(goal.current || 0);
        const amountLeft = Math.max(0, target - current);
        const deadline = goal.deadline ? new Date(`${goal.deadline}T12:00:00`) : null;
        const daysLeft = deadline ? Math.max(1, Math.ceil((deadline - now) / 86400000)) : 180;
        const urgencyBoost = daysLeft <= 31 ? 3 : daysLeft <= 90 ? 2 : 1;
        const priorityBoost = String(goal.priority || "").toLowerCase() === "high" ? 1.5 : String(goal.priority || "").toLowerCase() === "medium" ? 1.15 : 1;
        const weight = amountLeft > 0 ? (amountLeft / Math.max(daysLeft, 1)) * urgencyBoost * priorityBoost : 0;
        return { ...goal, amountLeft, daysLeft, weight };
      })
      .filter((goal) => goal.amountLeft > 0)
      .sort((a, b) => b.weight - a.weight);

    const totalWeight = activeGoals.reduce((sum, goal) => sum + goal.weight, 0);
    if (!activeGoals.length || totalWeight <= 0 || monthlyTarget <= 0) return [];
    return activeGoals.slice(0, 4).map((goal) => ({
      id: goal.id,
      name: goal.name,
      daysLeft: goal.daysLeft,
      amountLeft: goal.amountLeft,
      suggestedContribution: Math.round((goal.weight / totalWeight) * monthlyTarget),
    }));
  }, [goals, monthlyTarget, now]);

  async function add(event) {
    event.preventDefault();
    await api("/api/savings", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        target: parseMoneyInput(form.target),
        current: parseMoneyInput(form.current),
        monthlyContribution: parseMoneyInput(form.monthlyContribution),
      }),
    });
    setForm({ name: "", target: "", current: "0", monthlyContribution: String(savingsGuidance?.recommendedMonthlySavings || 0), deadline: "" });
    await onDone();
  }
  return (
    <div className="dashboard-page">
      <section className="summary-grid three">
        <Metric icon={<Target size={19} />} label="Monthly Target" value={formatMoney(monthlyTarget)} />
        <Metric icon={<PiggyBank size={19} />} label="Saved This Month" value={formatMoney(savedThisMonth)} valueClassName={savedThisMonth >= monthlyTarget ? "transaction-income-value" : ""} />
        <Metric icon={<AlertTriangle size={19} />} label="Catch-up Needed" value={formatMoney(savingsGap)} valueClassName={savingsGap > 0 ? "transaction-expense-value" : "transaction-income-value"} />
      </section>
      <section className="summary-grid three">
        <Metric icon={<CalendarDays size={19} />} label="Required Daily Pace" value={formatMoney(requiredDaily)} />
        <Metric icon={<TrendingUp size={19} />} label="Projected Month-End" value={formatMoney(projectedMonthEnd)} valueClassName={projectedMonthEnd >= monthlyTarget ? "transaction-income-value" : ""} />
        <Metric icon={<Activity size={19} />} label="Target Hit Chance" value={projectedMonthEnd >= monthlyTarget ? "On pace" : "Behind pace"} valueClassName={projectedMonthEnd >= monthlyTarget ? "transaction-income-value" : "transaction-expense-value"} />
      </section>
      <section className="panel section savings-shell">
        <h2>Savings Plan</h2>
        <p className="hint">Recommended target for age {savingsGuidance?.age || "profile"} is {Math.round((savingsGuidance?.recommendedSavingsRate || 0.2) * 100)}% of monthly income: {formatMoney(savingsGuidance?.recommendedMonthlySavings || income.monthlyIncome * 0.2)}.</p>
        {primarySavingsTarget && (
          <p className="hint">
            Current personal savings target: {formatMoney(primarySavingsTarget.target)} with a planned monthly pace of {formatMoney(primarySavingsTarget.monthlyContribution)}.
          </p>
        )}
        <form className="goal-form" onSubmit={add}>
          <input placeholder="What are you saving for?" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input placeholder="Target" value={formatMoneyInput(form.target)} inputMode="decimal" onChange={(event) => setForm({ ...form, target: formatMoneyInput(event.target.value) })} required />
          <input placeholder="Current" value={formatMoneyInput(form.current)} inputMode="decimal" onChange={(event) => setForm({ ...form, current: formatMoneyInput(event.target.value) })} />
          <input placeholder="Monthly" value={formatMoneyInput(form.monthlyContribution)} inputMode="decimal" onChange={(event) => setForm({ ...form, monthlyContribution: formatMoneyInput(event.target.value) })} />
          <button className="btn" type="submit"><Plus size={17} />Add Savings</button>
        </form>
      </section>
      <section className="panel section">
        <div className="section-heading">
          <div>
            <h2>Recommended Goal Split</h2>
            <p className="hint">How this month&apos;s savings target can be distributed across your active goals.</p>
          </div>
        </div>
        <div className="goal-grid">
          {splitAcrossGoals.length ? splitAcrossGoals.map((goal) => (
            <article className="panel section goal-card" key={goal.id}>
              <div className="section-heading">
                <div>
                  <h2>{goal.name}</h2>
                  <p className="hint">{goal.daysLeft} days left</p>
                </div>
                <strong className="transaction-income-value">{formatMoney(goal.suggestedContribution)}</strong>
              </div>
              <div className="money-row">
                <span>Amount left {formatMoney(goal.amountLeft)}</span>
                <span>Suggested this month {formatMoney(goal.suggestedContribution)}</span>
              </div>
            </article>
          )) : (
            <div className="empty-state">Add active goals to get an automatic split recommendation.</div>
          )}
        </div>
      </section>
      <section className="goal-grid">{savingsTargets.map((target) => <SavingsCard key={target.id} target={target} onDone={onDone} />)}</section>
    </div>
  );
});

function SavingsCard({ target, onDone }) {
  const progress = target.target > 0 ? Math.min(100, Math.round((target.current / target.target) * 100)) : 0;
  async function remove() {
    await api("/api/savings", { method: "DELETE", body: JSON.stringify({ id: target.id }) });
    await onDone();
  }
  return (
    <article className="panel section goal-card">
      <div className="section-heading"><div><h2>{target.name}</h2><p className="hint">{formatMoney(target.monthlyContribution)} monthly</p></div><button className="btn secondary icon danger" onClick={remove} title="Delete savings target"><Trash2 size={16} /></button></div>
      <div className="bar large"><span style={{ width: `${progress}%`, background: "#10B981" }} /></div>
      <div className="money-row"><span>{formatMoney(target.current)} saved</span><span>{formatMoney(target.target)} target</span></div>
    </article>
  );
}

const AnalyticsPage = memo(function AnalyticsPage({ categories, transactions, health, income, savingsGuidance, goals, analytics }) {
  const today = useMemo(() => new Date(), []);
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }), []);
  const fallbackMonthSeries = useMemo(() => {
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
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: monthFormatter.format(date),
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
      if (transaction.goalId || isGoalCategoryType(transaction.categoryType)) {
        bucket.goals += amount;
      }
      if (transaction.categoryType === "savings" || transaction.goalId || isGoalCategoryType(transaction.categoryType)) {
        bucket.savings += amount;
      }
      bucket.expenses += amount;
    });
    return months;
  }, [monthFormatter, today, transactions]);
  const monthSeries = analytics?.monthSeries?.length ? analytics.monthSeries : fallbackMonthSeries;
  const currentMonth = monthSeries[monthSeries.length - 1] || { expenses: 0, savings: 0, credits: 0, goals: 0 };
  const previousMonth = monthSeries[monthSeries.length - 2] || { expenses: 0, savings: 0, credits: 0, goals: 0 };
  const netBalance = income.monthlyIncome + currentMonth.credits - currentMonth.expenses;
  const savingsGap = Math.max(0, (savingsGuidance?.recommendedMonthlySavings || 0) - currentMonth.savings);
  const weekendSpend = transactions
    .filter((transaction) => transaction.categoryType !== "credit")
    .reduce((sum, transaction) => {
      const day = new Date(`${transaction.date}T12:00:00+05:30`).getDay();
      return sum + ((day === 0 || day === 6) ? Number(transaction.amount || 0) : 0);
    }, 0);
  const totalSpend = monthSeries.reduce((sum, month) => sum + month.expenses, 0);
  const weekendRatio = totalSpend > 0 ? Math.round((weekendSpend / totalSpend) * 100) : 0;
  const topRiskCategories = [...categories]
    .filter((category) => category.status !== "green")
    .sort((a, b) => (b.spent - b.expected) - (a.spent - a.expected))
    .slice(0, 2)
    .map((category) => ({
      title: `${category.label} is off pace`,
      risk: `${formatMoney(Math.max(0, category.spent - category.expected))} ahead of expected pace`,
      recovery: `Reduce by about ${formatMoney(Math.max(0, category.spent - category.expected))} over the rest of the month.`,
      tone: category.status,
    }));
  const goalForecasts = goals.map((goal) => {
    const target = Number(goal.target || 0);
    const current = Number(goal.current || 0);
    const amountLeft = Math.max(0, target - current);
    const monthlyGoalFlow = Math.max(0, monthSeries.reduce((sum, month) => sum + month.goals, 0) / Math.max(1, monthSeries.filter((month) => month.goals > 0).length || 1));
    const monthsNeeded = monthlyGoalFlow > 0 ? Math.ceil(amountLeft / monthlyGoalFlow) : null;
    const projected = monthsNeeded !== null ? new Date(today.getFullYear(), today.getMonth() + monthsNeeded, 1) : null;
    const deadline = goal.deadline ? new Date(`${goal.deadline}T12:00:00+05:30`) : null;
    const delayed = projected && deadline ? projected.getTime() > deadline.getTime() : false;
    return {
      ...goal,
      amountLeft,
      monthlyGoalFlow,
      projected,
      delayed,
    };
  }).sort((a, b) => a.amountLeft - b.amountLeft);
  const riskAndRecovery = [
    ...topRiskCategories,
    ...(savingsGap > 0 ? [{
      title: "Savings pace is behind target",
      risk: `${formatMoney(savingsGap)} still needed this month`,
      recovery: `Move ${formatMoney(Math.ceil(savingsGap / Math.max(1, 4 - Math.min(3, Math.floor(today.getDate() / 7)) )))} each remaining week into savings.`,
      tone: "orange",
    }] : []),
    ...(goalForecasts.filter((goal) => goal.delayed).slice(0, 1).map((goal) => ({
      title: `${goal.name} is drifting past target date`,
      risk: `${formatMoney(goal.amountLeft)} still left`,
      recovery: goal.monthlyGoalFlow > 0 ? `Raise monthly goal funding above ${formatMoney(goal.monthlyGoalFlow)}.` : "Start a recurring contribution to build momentum.",
      tone: "red",
    }))),
  ].slice(0, 3);
  const trajectoryVerdict = savingsGap > 0
    ? "Savings pace is slipping even though core spending is mostly under control."
    : netBalance < 0
      ? "Current spend is running above healthy monthly balance."
      : "Cash flow is stable and the month is still recoverable without sharp cuts.";
  const monthDelta = currentMonth.expenses - previousMonth.expenses;
  const savingsDelta = currentMonth.savings - previousMonth.savings;
  const recurringNotes = Object.entries(transactions
    .filter((transaction) => transaction.categoryType !== "credit")
    .reduce((acc, transaction) => {
      const key = String(transaction.note || "").trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}))
    .filter(([, count]) => count >= 2)
    .slice(0, 2)
    .map(([note, count]) => ({ note, count }));
  const topSpendDate = analytics?.topSpendDate || null;
  const healthTrendData = analytics?.healthTrend?.length ? analytics.healthTrend : [{ label: monthSeries[monthSeries.length - 1]?.label || "Now", score: Number(health.score || 0) }];
  const savingsRatePercent = income.monthlyIncome > 0 ? Math.max(0, Math.min(100, Math.round((currentMonth.savings / income.monthlyIncome) * 100))) : 0;
  const netBalancePercent = income.monthlyIncome > 0 ? Math.max(0, Math.min(100, Math.round((Math.max(0, netBalance) / income.monthlyIncome) * 100))) : 0;
  const healthPercent = Math.max(0, Math.min(100, Math.round(health.score || 0)));
  return (
    <div className="dashboard-page analytics-page-redesign">
      <section className="analytics-hero">
        <div className="analytics-hero-copy">
          <span className="eyebrow">Financial trajectory</span>
          <h2>{trajectoryVerdict}</h2>
          <p className="hint">This page focuses on change, forecast, and recovery. It avoids repeating dashboard allocation views.</p>
          <div className="analytics-score-band">
            <HealthScoreTrendChart data={healthTrendData} />
          </div>
        </div>
        <div className="analytics-hero-metrics">
          <div>
            <div className="analytics-metric-head">
              <span>Health score</span>
              <CircleGauge size={16} />
            </div>
            <strong>{health.score}/100</strong>
            <small>{health.category}</small>
            <div className="analytics-mini-track"><span style={{ width: `${healthPercent}%` }} /></div>
          </div>
          <div>
            <div className="analytics-metric-head">
              <span>Net balance this month</span>
              <TrendingUp size={16} />
            </div>
            <strong className={netBalance >= 0 ? "positive" : "negative"}>{formatMoney(netBalance)}</strong>
            <small>{monthDelta >= 0 ? `${formatMoney(Math.abs(monthDelta))} more spent than last month` : `${formatMoney(Math.abs(monthDelta))} less spent than last month`}</small>
            <div className="analytics-mini-track"><span style={{ width: `${netBalancePercent}%` }} /></div>
          </div>
          <div>
            <div className="analytics-metric-head">
              <span>Savings gap</span>
              <Target size={16} />
            </div>
            <strong className={savingsGap > 0 ? "negative" : "positive"}>{formatMoney(savingsGap)}</strong>
            <small>{savingsDelta >= 0 ? `${formatMoney(savingsDelta)} above last month` : `${formatMoney(Math.abs(savingsDelta))} below last month`}</small>
            <div className="analytics-mini-track"><span style={{ width: `${savingsRatePercent}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="analytics-redesign-grid">
        <article className="panel section analytics-momentum-panel">
          <div className="section-header">
            <div>
              <h2>Monthly Momentum</h2>
              <p className="hint">Month-by-month view of expenses, savings moves, and credits across your tracked history.</p>
            </div>
          </div>
          <div className="analytics-timeline">
            {monthSeries.map((month) => {
              const maxValue = Math.max(...monthSeries.map((item) => Math.max(item.expenses, item.savings, item.credits, 1)));
              return (
                <div className="analytics-timeline-month" key={month.key}>
                  <span className="analytics-timeline-label">{month.label}</span>
                  <div className="analytics-timeline-bars">
                    <div className="analytics-timeline-bar expense" style={{ height: `${Math.max(8, Math.round((month.expenses / maxValue) * 100))}%` }} />
                    <div className="analytics-timeline-bar savings" style={{ height: `${Math.max(8, Math.round((month.savings / maxValue) * 100))}%` }} />
                    <div className="analytics-timeline-bar credit" style={{ height: `${Math.max(8, Math.round((month.credits / maxValue) * 100))}%` }} />
                  </div>
                  <small>{formatMoney(month.expenses)}</small>
                </div>
              );
            })}
          </div>
          <div className="analytics-inline-legend">
            <span><i className="legend-swatch expense" />Expenses</span>
            <span><i className="legend-swatch savings" />Savings</span>
            <span><i className="legend-swatch credit" />Credits</span>
          </div>
        </article>

        <article className="panel section analytics-risk-panel">
          <div className="section-header">
            <div>
              <h2>Risk and Recovery</h2>
              <p className="hint">The shortest path to improving this month.</p>
            </div>
          </div>
          <div className="analytics-recovery-list">
            {riskAndRecovery.length ? riskAndRecovery.map((item) => (
              <div className={`analytics-recovery-item ${item.tone}`} key={item.title}>
                <div className="analytics-recovery-head">
                  <strong>{item.title}</strong>
                  {item.tone === "red" ? <AlertTriangle size={16} /> : item.tone === "orange" ? <TrendingUp size={16} /> : <Check size={16} />}
                </div>
                <div className="analytics-severity-track"><span className={item.tone} /></div>
                <p className="hint">{item.risk}</p>
                <small>{item.recovery}</small>
              </div>
            )) : (
              <div className="analytics-recovery-item green">
                <strong>No immediate recovery pressure</strong>
                <p className="hint">Current categories and savings pace are stable.</p>
                <small>Use this month to keep goal funding consistent.</small>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="analytics-redesign-grid lower">
        <article className="panel section analytics-forecast-panel">
          <div className="section-header">
            <div>
              <h2>Goal Forecast Engine</h2>
              <p className="hint">Projected completion timing at your current contribution pace.</p>
            </div>
          </div>
          <div className="analytics-forecast-list">
            {goalForecasts.length ? goalForecasts.map((goal) => (
              <div className="analytics-forecast-row" key={goal.id}>
                <div>
                  <strong>{goal.emoji} {goal.name}</strong>
                  <p className="hint">{formatMoney(goal.amountLeft)} left</p>
                  <div className="analytics-goal-progress">
                    <span style={{ width: `${goal.target > 0 ? Math.max(6, Math.min(100, Math.round((Number(goal.current || 0) / Number(goal.target || 1)) * 100))) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <span className={`badge ${goal.delayed ? "red" : "green"}`}>{goal.delayed ? "Behind pace" : "On pace"}</span>
                  <p className="hint">{goal.monthlyGoalFlow > 0 ? `${formatMoney(goal.monthlyGoalFlow)} average monthly funding` : "No contribution pace yet"}</p>
                </div>
                <div className="analytics-forecast-date">
                  <strong>{goal.projected ? formatShortIndiaDate(`${goal.projected.getFullYear()}-${String(goal.projected.getMonth() + 1).padStart(2, "0")}-01`) : "Needs first transfer"}</strong>
                  <small>{goal.deadline ? `Target ${formatShortIndiaDate(goal.deadline)}` : "No deadline"}</small>
                </div>
              </div>
            )) : <div className="empty-state">No active goals to forecast yet.</div>}
          </div>
        </article>

        <article className="panel section analytics-signals-panel">
          <div className="section-header">
            <div>
              <h2>Behavior Signals</h2>
              <p className="hint">Patterns worth noticing before they become budget problems.</p>
            </div>
          </div>
          <div className="analytics-signals-list">
            <div className="analytics-signal-card">
              <div className="analytics-signal-head">
                <span>Weekend spend share</span>
                <CalendarDays size={16} />
              </div>
              <strong>{weekendRatio}%</strong>
              <div className="analytics-mini-track"><span style={{ width: `${weekendRatio}%` }} /></div>
              <small>{weekendRatio >= 35 ? "Weekend spending is materially shaping the month." : "Weekend spending is not dominating the month."}</small>
            </div>
            <div className="analytics-signal-card">
              <div className="analytics-signal-head">
                <span>Highest spend day</span>
                <Activity size={16} />
              </div>
              <strong>{topSpendDate?.date ? formatShortIndiaDate(topSpendDate.date) : "None"}</strong>
              <small>{topSpendDate?.spending ? `${formatMoney(topSpendDate.spending)} spent on that date.` : "No spending recorded."}</small>
            </div>
            <div className="analytics-signal-card">
              <div className="analytics-signal-head">
                <span>Recurring spend notes</span>
                <CreditCard size={16} />
              </div>
              <strong>{recurringNotes.length || 0}</strong>
              <small>{recurringNotes.length ? recurringNotes.map((item) => `${item.note} x${item.count}`).join(" • ") : "No repeated spending notes detected."}</small>
            </div>
            <div className="analytics-signal-card">
              <div className="analytics-signal-head">
                <span>What changed</span>
                <TrendingUp size={16} />
              </div>
              <strong>{monthDelta >= 0 ? "Expense pressure rose" : "Expense pressure eased"}</strong>
              <small>{monthDelta >= 0 ? `${formatMoney(Math.abs(monthDelta))} more spent than last month.` : `${formatMoney(Math.abs(monthDelta))} less spent than last month.`}</small>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
});

function TrendLine({ points = [], accent = "#7DD3FC", height = 42, strokeWidth = 1.7, smooth = false }) {
  const path = useMemo(() => buildLinePath(points, 100, height, smooth), [height, points, smooth]);
  return (
    <svg className="trend-line" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin={smooth ? "round" : "miter"}
        vectorEffect="non-scaling-stroke"
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
}

function PortfolioRangeChart({ points = [], accent = "#7DD3FC", height = 104, strokeWidth = 1.7, currency = "INR", rangeKey = "1M" }) {
  const path = useMemo(() => buildLinePath(points, 100, height, false), [height, points]);
  const coordinates = useMemo(() => buildLineCoordinates(points, 100, height), [height, points]);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const activeIndex = hoverIndex >= 0 && hoverIndex < points.length ? hoverIndex : points.length - 1;
  const activePoint = points[activeIndex] || null;
  const activeCoordinate = coordinates[activeIndex] || null;

  function handleMove(event) {
    if (!points.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
    const nextIndex = points.length === 1
      ? 0
      : Math.round((relativeX / Math.max(bounds.width, 1)) * (points.length - 1));
    setHoverIndex(nextIndex);
  }

  function hoverLabel(point) {
    if (!point) return "";
    if (rangeKey === "1D") return point.label || "Session";
    return formatShortIndiaDate(point.date || point.label || "");
  }

  return (
    <div className="portfolio-range-chart" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(-1)}>
      <svg className="trend-line interactive" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-label="Portfolio range chart">
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />
        {activeCoordinate && (
          <>
            <line
              x1={activeCoordinate.x}
              y1="0"
              x2={activeCoordinate.x}
              y2={height}
              className="portfolio-range-crosshair"
            />
            <circle
              cx={activeCoordinate.x}
              cy={activeCoordinate.y}
              r="2.1"
              fill={accent}
              stroke="rgba(255,255,255,0.96)"
              strokeWidth="0.9"
            />
          </>
        )}
      </svg>
      {activePoint && activeCoordinate && (
        <div
          className="portfolio-range-tooltip"
          style={{
            left: `${Math.min(92, Math.max(8, activeCoordinate.x))}%`,
          }}
        >
          <strong>{formatMarketMoney(activePoint.price, currency)}</strong>
          <span>{hoverLabel(activePoint)}</span>
        </div>
      )}
    </div>
  );
}

const AssistantPage = memo(function AssistantPage({ conversations = [], conversation, messages, draft, error, loading, onDraftChange, onSubmit, onSelectConversation, onNewConversation }) {
  const hasMessages = messages.length > 0;
  const questions = assistantQuestionsForPage("assistant");
  const conversationTitle = conversation?.title || (hasMessages ? assistantConversationTitle(messages.find((message) => message.role === "user")?.content) : "New Chat");
  const conversationTimestamp = formatAssistantTimestamp(conversation?.createdAt || messages[0]?.createdAt);

  function submit(event) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <div className={`dashboard-page assistant-page ${hasMessages ? "with-history" : "empty"}`}>
      <div className="assistant-shell">
        <aside className="assistant-history">
          <div className="section-heading">
            <div>
              <h2>Chats</h2>
              <p className="hint">Saved assistant conversations</p>
            </div>
            <button className="btn secondary" type="button" onClick={onNewConversation}><Plus size={16} />New</button>
          </div>
          <div className="assistant-history-list">
            {conversations.length ? conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`assistant-history-item ${conversation?.id === item.id ? "active" : ""}`}
                onClick={() => onSelectConversation(item)}
              >
                <strong>{item.title}</strong>
                <span>{formatAssistantTimestamp(item.createdAt)}</span>
              </button>
            )) : <div className="empty-state">No saved chats yet.</div>}
          </div>
        </aside>

        {!hasMessages ? (
          <section className="assistant-hero">
            <div className="assistant-kicker"><Sparkles size={18} /><span>Finova AI Assistant</span></div>
            <h2>Start a new conversation.</h2>
            <p className="hint">This workspace keeps its own saved chats and uses your full Finova data, separate from the quick assistants on other pages.</p>
            <form className="assistant-composer centered" onSubmit={submit}>
              <textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder="Ask anything about your finances..."
                rows={3}
              />
              <button className="btn" type="submit" disabled={loading || !draft.trim()}>
                <Sparkles size={17} />
                {loading ? "Thinking..." : "Ask Finova AI"}
              </button>
            </form>
            <div className="assistant-samples">
              {questions.map((question) => (
                <button key={question} type="button" className="assistant-sample" onClick={() => onSubmit(question)}>
                  {question}
                </button>
              ))}
            </div>
            {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
          </section>
        ) : (
          <section className="assistant-thread-shell">
            <div className="assistant-thread-meta">
              <div>
                <h2>{conversationTitle}</h2>
                <p className="hint">{conversationTimestamp || "Unsaved conversation"}</p>
              </div>
            </div>
            <div className="assistant-thread">
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
                  <div className="assistant-avatar">{message.role === "assistant" ? "AI" : "You"}</div>
                  <div className="assistant-bubble">
                    <p>{message.content}</p>
                    {message.modelUsed && <span className="hint">Model: {message.modelUsed}</span>}
                  </div>
                </article>
              ))}
              {loading && (
                <article className="assistant-message assistant">
                  <div className="assistant-avatar">AI</div>
                  <div className="assistant-bubble typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              )}
            </div>
            <form className="assistant-composer docked" onSubmit={submit}>
              <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Ask a follow-up..." rows={2} />
              <button className="btn" type="submit" disabled={loading || !draft.trim()}>
                <Sparkles size={17} />
                Send
              </button>
            </form>
            <div className="assistant-samples compact">
              {questions.map((question) => (
                <button key={question} type="button" className="assistant-sample" onClick={() => onSubmit(question)}>
                  {question}
                </button>
              ))}
            </div>
            {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
          </section>
        )}
      </div>
    </div>
  );
});

const AssistantOverlay = memo(function AssistantOverlay({ messages, draft, error, loading, pageContext, onDraftChange, onSubmit, onClose }) {
  const questions = assistantQuestionsForPage(pageContext);

  function submit(event) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <div className="assistant-overlay-backdrop" onClick={onClose}>
      <section className="assistant-overlay-panel" onClick={(event) => event.stopPropagation()}>
        <div className="assistant-overlay-head">
          <div>
            <h2>AI Assistant</h2>
            <p className="hint">Context source: {pageLabelForAssistant(pageContext)}</p>
          </div>
          <button className="btn secondary icon" type="button" title="Close assistant" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="assistant-overlay-thread">
          {messages.length ? messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
              <div className="assistant-avatar">{message.role === "assistant" ? "AI" : "You"}</div>
              <div className="assistant-bubble">
                <p>{message.content}</p>
                {message.modelUsed && <span className="hint">Model: {message.modelUsed}</span>}
              </div>
            </article>
          )) : (
            <div className="assistant-overlay-empty">
              {questions.map((question) => (
                <button key={question} type="button" className="assistant-sample" onClick={() => onSubmit(question)}>
                  {question}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <article className="assistant-message assistant">
              <div className="assistant-avatar">AI</div>
              <div className="assistant-bubble typing">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
        </div>
        <form className="assistant-composer docked overlay" onSubmit={submit}>
          <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Ask about this page..." rows={2} />
          <button className="btn" type="submit" disabled={loading || !draft.trim()}>
            <Sparkles size={17} />
            Send
          </button>
        </form>
        {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
      </section>
    </div>
  );
});

const InvestmentsPage = memo(function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState({ holdings: [], positions: [], summary: { rangeSeries: {} }, watchlist: [], insights: [], marketConfigured: false });
  const [rows, setRows] = useState([{ symbol: "", name: "", shares: "", totalCost: "", exchange: "", currency: "INR" }]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [investmentInsights, setInvestmentInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const cachedPortfolio = readPortfolioSessionCache();
      if (cachedPortfolio) {
        setPortfolio(cachedPortfolio);
        return;
      }
      const nextPortfolio = await api("/api/market?mode=portfolio");
      writePortfolioSessionCache(nextPortfolio);
      setPortfolio(nextPortfolio);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadPortfolio = useCallback(async () => {
    clearPortfolioSessionCache();
    setLoading(true);
    setError("");
    try {
      const nextPortfolio = await api("/api/market?mode=portfolio");
      writePortfolioSessionCache(nextPortfolio);
      setPortfolio(nextPortfolio);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      setInsightsLoading(true);
      setInsightsError("");
      try {
        const result = await api("/api/assistant/insights", {
          method: "POST",
          body: JSON.stringify({ page: "investments" }),
        });
        if (!cancelled) setInvestmentInsights((result.insights || []).map(parseInsightCard));
      } catch (loadError) {
        if (!cancelled) {
          setInvestmentInsights([]);
          setInsightsError(loadError.message);
        }
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    loadInsights();
    return () => {
      cancelled = true;
    };
  }, [portfolio.holdings, portfolio.positions]);

  const selectedRangeMetrics = portfolio.summary?.rangeMetrics?.[selectedRange] || { change: 0, changePercent: 0 };
  const hasHoldings = (portfolio.holdings || []).length > 0;
  const watchlistPreview = (portfolio.watchlist || []).slice(0, 3);
  const bestPosition = useMemo(() => [...(portfolio.positions || [])].sort((a, b) => Number(b.rangeMetrics?.[selectedRange]?.changePercent || 0) - Number(a.rangeMetrics?.[selectedRange]?.changePercent || 0))[0] || null, [portfolio.positions, selectedRange]);
  const weakestPosition = useMemo(() => [...(portfolio.positions || [])].sort((a, b) => Number(a.rangeMetrics?.[selectedRange]?.changePercent || 0) - Number(b.rangeMetrics?.[selectedRange]?.changePercent || 0))[0] || null, [portfolio.positions, selectedRange]);
  const activeSeries = portfolio.summary?.rangeSeries?.[selectedRange] || [];
  const rangeStart = Number(activeSeries[0]?.price || 0);
  const rangeEnd = Number(activeSeries[activeSeries.length - 1]?.price || 0);
  const rangeChange = rangeStart > 0 ? rangeEnd - rangeStart : Number(selectedRangeMetrics.change || 0);
  const rangeChangePercent = rangeStart > 0 ? (rangeChange / rangeStart) * 100 : Number(selectedRangeMetrics.changePercent || 0);
  const providerCopy = portfolio.providerStatus === "india_plan_upgrade_required"
    ? "Indian discovery is active, but your Twelve Data fallback plan still cannot price some NSE flows."
    : portfolio.providerStatus === "indian_api_error"
      ? "Indian API is configured, but the latest equity response could not be read."
      : portfolio.indianMarketConfigured
        ? "Indian market data is active for equities and range history."
        : portfolio.marketConfigured
          ? "Fallback market data is active for commodity and non-Indian assets."
          : "Add market API keys to enable live pricing.";

  function updateRow(index, patch) {
    setRows((current) => current.map((row, currentIndex) => currentIndex === index ? { ...row, ...patch } : row));
  }

  function addRow() {
    setRows((current) => [...current, { symbol: "", name: "", shares: "", totalCost: "", exchange: "", currency: "INR" }]);
  }

  function removeRow(index) {
    setRows((current) => current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function hydrateHolding(index, symbol) {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    try {
      const result = await api(`/api/market?mode=search&query=${encodeURIComponent(clean)}`);
      const first = result.results?.[0];
      if (!first) return;
      updateRow(index, {
        symbol: first.symbol,
        name: rows[index]?.name || first.name,
        exchange: first.exchange || "",
        currency: first.currency || "INR",
      });
    } catch {
      // manual entry is still allowed
    }
  }

  async function savePortfolio(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const holdings = rows
        .map((row) => ({
          symbol: row.symbol.trim().toUpperCase(),
          name: row.name.trim(),
          shares: Number(row.shares),
          totalCost: parseMoneyInput(row.totalCost),
          exchange: row.exchange?.trim() || "",
          currency: row.currency?.trim().toUpperCase() || "INR",
        }))
        .filter((row) => row.symbol && row.name && row.shares > 0 && row.totalCost > 0);
      if (!holdings.length) throw new Error("Add at least one complete holding before saving.");
      await api("/api/investments", { method: "POST", body: JSON.stringify({ holdings }) });
      setRows([{ symbol: "", name: "", shares: "", totalCost: "", exchange: "", currency: "INR" }]);
      setNotice("Portfolio saved.");
      await reloadPortfolio();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeHolding(id) {
    setError("");
    try {
      await api("/api/investments", { method: "DELETE", body: JSON.stringify({ id }) });
      await reloadPortfolio();
    } catch (removeError) {
      setError(removeError.message);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <section className="panel section shell-page">
          <h2>Investments</h2>
          <p className="hint">Loading portfolio data...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page investments-page">
      {!hasHoldings ? (
        <section className="investment-setup-shell">
          <div className="investment-setup investment-setup-redesign">
            <div className="investment-copy">
              <p className="eyebrow">Portfolio setup</p>
              <h2>Build your investing workspace.</h2>
              <p className="hint">Add each stock with its ticker, shares held, and total cost. Finova will price the portfolio in INR and build the portfolio chart from real market history.</p>
              <p className="hint">{providerCopy}</p>
              <div className="investment-preview-rail">
                <div className="investment-preview-card main">
                  <div className="investment-preview-head">
                    <span>Market watch preview</span>
                    <strong>{watchlistPreview.length ? "Live watchlist" : "Waiting for market data"}</strong>
                  </div>
                  <div className="investment-preview-commodities">
                    {watchlistPreview.map((item) => (
                      <div className="investment-preview-commodity" key={item.symbol}>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.ticker}</small>
                        </div>
                        <span className={item.todayChangePercent >= 0 ? "positive" : "negative"}>{formatSignedPercent(item.todayChangePercent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <form className="investment-form investment-form-panel" onSubmit={savePortfolio}>
              {rows.map((row, index) => (
                <div className="holding-entry" key={`${row.symbol}-${index}`}>
                  <div className="holding-entry-grid">
                    <input
                      placeholder="Ticker"
                      value={row.symbol}
                      onChange={(event) => updateRow(index, { symbol: event.target.value.toUpperCase() })}
                      onBlur={() => hydrateHolding(index, row.symbol)}
                    />
                    <input placeholder="Company name" value={row.name} onChange={(event) => updateRow(index, { name: event.target.value })} />
                    <input type="number" min="0.0001" step="0.0001" placeholder="Shares held" value={row.shares} onChange={(event) => updateRow(index, { shares: event.target.value })} />
                    <input placeholder="Total cost" value={formatMoneyInput(row.totalCost)} inputMode="decimal" onChange={(event) => updateRow(index, { totalCost: formatMoneyInput(event.target.value) })} />
                  </div>
                  <div className="holding-entry-actions">
                    <span className="hint">{row.exchange ? `${row.exchange} | ${row.currency}` : "Ticker lookup fills exchange and currency when provider search is available."}</span>
                    {rows.length > 1 && <button type="button" className="btn secondary icon danger" onClick={() => removeRow(index)} title="Remove row"><Trash2 size={16} /></button>}
                  </div>
                </div>
              ))}
              <div className="investment-form-actions">
                <button className="btn secondary" type="button" onClick={addRow}><Plus size={17} />Add another holding</button>
                <button className="btn" type="submit" disabled={saving}>
                  <Save size={17} />
                  {saving ? "Saving..." : "Save portfolio"}
                </button>
              </div>
              {notice && <div className="alert info"><Check size={18} /><span>{notice}</span></div>}
              {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
            </form>
          </div>
        </section>
      ) : (
        <>
          <section className="investment-hero-shell investment-hero-rebuilt">
            <div className="investment-hero-main-card">
              <div className="investment-hero-stack">
                <div>
                  <p className="eyebrow">Portfolio value</p>
                  <h2>{formatMarketMoney(portfolio.summary?.currentValue || 0)}</h2>
                  <p className="hint">Invested {formatMarketMoney(portfolio.summary?.totalInvested || 0)}</p>
                </div>
                <div className="investment-range-bar">
                  {["1D", "5D", "1M", "3M", "ALL"].map((rangeKey) => (
                    <button
                      key={rangeKey}
                      type="button"
                      className={`range-chip ${selectedRange === rangeKey ? "active" : ""}`}
                      onClick={() => setSelectedRange(rangeKey)}
                    >
                      {rangeKey}
                    </button>
                  ))}
                </div>
                <div className="investment-range-line">
                  <PortfolioRangeChart points={activeSeries} accent={rangeChange >= 0 ? "#10B981" : "#EF4444"} height={104} strokeWidth={1.95} currency="INR" rangeKey={selectedRange} />
                </div>
                <div className={`investment-range-caption ${rangeChange >= 0 ? "positive" : "negative"}`}>
                  <strong>{formatSignedMoney(rangeChange)}</strong>
                  <span>{formatSignedPercent(rangeChangePercent)} over {selectedRange}</span>
                </div>
              </div>
            </div>
            <div className="investment-hero-sidecards">
              <div className="investment-stat-card">
                <span>Change</span>
                <strong className={Number(selectedRangeMetrics.changePercent || 0) >= 0 ? "positive" : "negative"}>{formatSignedPercent(selectedRangeMetrics.changePercent || 0)}</strong>
                <small>{portfolio.summary?.holdingCount || 0} holdings | {selectedRange} range</small>
              </div>
              <div className="investment-stat-card">
                <span>Unrealized gain / loss</span>
                <strong className={Number(selectedRangeMetrics.change || 0) >= 0 ? "positive" : "negative"}>{formatSignedMoney(selectedRangeMetrics.change || 0)}</strong>
                <small>{providerCopy}</small>
              </div>
              <div className="investment-hero-mini-grid">
                <div className="investment-stat-card compact">
                  <span>Top mover</span>
                  <strong>{bestPosition?.symbol || "--"}</strong>
                  <small className={Number(bestPosition?.rangeMetrics?.[selectedRange]?.changePercent || 0) >= 0 ? "positive" : "negative"}>{bestPosition ? formatSignedPercent(bestPosition.rangeMetrics?.[selectedRange]?.changePercent || 0) : "No data"}</small>
                </div>
                <div className="investment-stat-card compact">
                  <span>Needs attention</span>
                  <strong>{weakestPosition?.symbol || "--"}</strong>
                  <small className={Number(weakestPosition?.rangeMetrics?.[selectedRange]?.changePercent || 0) >= 0 ? "positive" : "negative"}>{weakestPosition ? formatSignedPercent(weakestPosition.rangeMetrics?.[selectedRange]?.changePercent || 0) : "No data"}</small>
                </div>
              </div>
            </div>
          </section>

          <section className="investment-content-grid">
            <section className="investment-holdings-shell">
              <div className="section-heading">
                <div>
                  <h2>Stocks</h2>
                  <p className="hint">Every holding with current value, cost basis, and the live day trend.</p>
                </div>
              </div>
              <div className="investment-holdings-list">
                {portfolio.positions.map((position) => (
                  <article className="investment-row" key={position.id}>
                    <div className="investment-row-main">
                      <div className="investment-row-ident">
                        <div className="investment-symbol-chip">{position.symbol.slice(0, 2)}</div>
                        <div>
                          <strong>{position.name}</strong>
                          <p className="hint">{position.symbol} | {position.shares} shares</p>
                        </div>
                      </div>
                      <div className="investment-row-figures">
                        <span>{formatMarketMoney(position.currentPrice, position.currency)}</span>
                        <strong>{formatMarketMoney(position.currentValue, position.currency)}</strong>
                      </div>
                    </div>
                    <div className="investment-row-chart">
                      <TrendLine points={position.chart} accent={position.todayChange >= 0 ? "#10B981" : "#EF4444"} height={24} strokeWidth={1.2} />
                    </div>
                    <div className="investment-row-meta">
                      <span>Invested {formatMarketMoney(position.totalCost, position.currency)}</span>
                      <span>Prev. Close {formatMarketMoney(position.previousClose, position.currency)}</span>
                      <span className={position.todayChange >= 0 ? "positive" : "negative"}>Today {formatSignedPercent(position.todayChangePercent)}</span>
                      <span className={position.unrealizedGain >= 0 ? "positive" : "negative"}>{formatSignedMoney(position.unrealizedGain, position.currency)}</span>
                      <button className="btn secondary icon danger" type="button" title="Delete holding" onClick={() => removeHolding(position.id)}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="investment-watchlist-shell investment-watchlist-side">
              <div className="section-heading">
                <div>
                  <h2>Watchlist</h2>
                  <p className="hint">Ten live names across Indian equities and market anchors.</p>
                </div>
              </div>
              <div className="commodity-watchlist robinhood-watchlist">
                {(portfolio.watchlist || []).map((item) => (
                  <article className="commodity-row commodity-card watchlist-row" key={item.symbol}>
                    <div className="investment-row-ident">
                      <div className="investment-symbol-chip commodity" style={{ color: item.accent, borderColor: `${item.accent}40`, background: `${item.accent}15` }}>{item.ticker.slice(0, 2)}</div>
                      <div>
                        <strong>{item.label}</strong>
                        <p className="hint">{item.ticker}</p>
                      </div>
                    </div>
                    <div className="watchlist-row-prices">
                      <span>Prev. Close {formatMarketMoney(item.previousPrice, item.currency)}</span>
                      <strong>{formatMarketMoney(item.currentPrice, item.currency)}</strong>
                      <small className={item.todayChangePercent >= 0 ? "positive" : "negative"}>{formatSignedPercent(item.todayChangePercent)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </section>

          <section className="investment-content-grid lower">
            <section className="investment-form investment-form-panel">
              <div className="section-heading">
                <div>
                  <h2>Add Holdings</h2>
                  <p className="hint">Add more Indian stocks or funds and Finova will fold them into the main chart immediately.</p>
                </div>
              </div>
              <form onSubmit={savePortfolio}>
                {rows.map((row, index) => (
                  <div className="holding-entry" key={`${row.symbol}-${index}`}>
                    <div className="holding-entry-grid">
                      <input placeholder="Ticker" value={row.symbol} onChange={(event) => updateRow(index, { symbol: event.target.value.toUpperCase() })} onBlur={() => hydrateHolding(index, row.symbol)} />
                      <input placeholder="Company name" value={row.name} onChange={(event) => updateRow(index, { name: event.target.value })} />
                      <input type="number" min="0.0001" step="0.0001" placeholder="Shares held" value={row.shares} onChange={(event) => updateRow(index, { shares: event.target.value })} />
                      <input placeholder="Total cost" value={formatMoneyInput(row.totalCost)} inputMode="decimal" onChange={(event) => updateRow(index, { totalCost: formatMoneyInput(event.target.value) })} />
                    </div>
                    <div className="holding-entry-actions">
                      <span className="hint">{row.exchange ? `${row.exchange} | ${row.currency}` : "Ticker lookup fills name and exchange when market search is available."}</span>
                      {rows.length > 1 && <button type="button" className="btn secondary icon danger" onClick={() => removeRow(index)} title="Remove row"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                ))}
                <div className="investment-form-actions">
                  <button className="btn secondary" type="button" onClick={addRow}><Plus size={17} />Add another row</button>
                  <button className="btn" type="submit" disabled={saving}>
                    <Save size={17} />
                    {saving ? "Saving..." : "Add to portfolio"}
                  </button>
                </div>
                {notice && <div className="alert info"><Check size={18} /><span>{notice}</span></div>}
                {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
              </form>
            </section>

            <section className="panel section investment-insights-shell">
              <div className="recommendations investment-insight-list">
                {insightsLoading ? (
                  <div className="recommendation low">
                    <strong>Loading insights</strong>
                    <p className="hint">Gemini is generating fresh portfolio takeaways.</p>
                  </div>
                ) : insightsError ? (
                  <div className="recommendation low">
                    <strong>Insights unavailable</strong>
                    <p className="hint">{insightsError}</p>
                  </div>
                ) : investmentInsights.length ? investmentInsights.map((insight, index) => (
                  <div className="recommendation low" key={`${insight.title}-${index}`}>
                    <strong>{insight.title}</strong>
                    <p className="hint">{insight.body}</p>
                  </div>
                )) : (
                  <div className="recommendation low">
                    <strong>No insights yet</strong>
                    <p className="hint">Add more priced holdings to generate portfolio commentary.</p>
                  </div>
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  );
});

const BudgetManagementPage = memo(function BudgetManagementPage({ categories, chartData, pieData, ranking, onDone }) {
  return (
    <div className="dashboard-page">
      <section className="budget-primary-grid">
        <div className="panel section category-panel">
          <div className="section-heading">
            <div>
              <h2>Category Tracking</h2>
              <p className="hint">Monitor limits, expected pace, and remaining budget by priority.</p>
            </div>
          </div>
          <div className="category-list expanded">
            {categories.map((category) => <CategoryRow key={category.id} category={category} />)}
          </div>
        </div>
        <TransactionForm onDone={onDone} />
      </section>

      <section className="analytics-grid">
        <ActualExpectedChart chartData={chartData} />
        <BudgetAllocationChart pieData={pieData} />
        <ProblemCategories ranking={ranking} />
      </section>
    </div>
  );
});

const InsightsHabitsPage = memo(function InsightsHabitsPage({ recommendations, habits, metals, transactions, categories, debtObligations, emiReminders, onDone }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const transactionsForDate = useMemo(
    () => transactions.filter((transaction) => transaction.date === selectedDate),
    [transactions, selectedDate],
  );
  const remindersForDate = useMemo(
    () => emiReminders.filter((reminder) => reminder.date === selectedDate),
    [emiReminders, selectedDate],
  );

  return (
    <div className="dashboard-page insights-grid">
      <HabitCalendar habits={habits} transactions={transactions} emiReminders={emiReminders} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <DailyTransactions selectedDate={selectedDate} transactions={transactionsForDate} reminders={remindersForDate} onDone={onDone} />
      {debtObligations.length > 0 && <DebtPlanPanel debts={debtObligations} />}
      <RecommendationsPanel recommendations={recommendations} />
      <HabitPanel categories={categories} onDone={onDone} />
      <MetalInsights metals={metals} />
    </div>
  );
});

const DebtPlanPanel = memo(function DebtPlanPanel({ debts }) {
  return (
    <div className="panel section debt-plan-panel">
      <h2>Debt Plan</h2>
      <div className="debt-plan-list">
        {debts.map((debt) => (
          <div className="debt-plan-row" key={debt.id}>
            <div>
              <strong>{debt.name}</strong>
              <div className="hint">{debt.goalLabel} | Payoff target {new Date(`${debt.payoffDate}T12:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
            </div>
            <div className="debt-plan-metrics">
              <span>EMI {formatMoney(debt.estimatedEmi)}</span>
              <span>Remaining {formatMoney(debt.remainingBalance)}</span>
              <span>{debt.repaymentProgress}% repaid</span>
            </div>
            <p className="hint">{debt.goalAction}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

const ProblemCategories = memo(function ProblemCategories({ ranking }) {
  return (
    <div className="panel section problem-panel">
      <h2>Top Problem Categories</h2>
      <div className="ranking compact">
        {ranking.map((item) => (
          <div className="rank-item" key={item.id}>
            <div>
              <strong>{item.label}</strong>
              <div className="hint">Risk score {(item.riskScore || 0).toFixed(2)} using weight {item.weight}</div>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
});

const RecommendationsPanel = memo(function RecommendationsPanel({ recommendations, variant = "default" }) {
  if (variant === "ai") {
    return (
      <section className="panel section ai-panel">
        <div className="ai-icon"><Sparkles size={22} /></div>
        <div>
          <h2>AI Insights</h2>
          <ul className="ai-bullet-list">
            {recommendations.map((rec) => <li key={rec.id}>{rec.title}: {rec.body}</li>)}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <div className="panel section">
      <h2>Recommendations</h2>
      <div className="recommendations">
        {recommendations.map((rec) => (
          <div className={`recommendation ${rec.severity}`} key={rec.id}>
            <strong>{rec.title}</strong>
            <p className="hint">{rec.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

const AIInsightsPanel = memo(function AIInsightsPanel({ insights = [], loading = false, error = "" }) {
  return (
    <section className="panel section ai-panel">
      <div className="ai-icon"><Sparkles size={22} /></div>
      <div>
        <h2>AI Insights</h2>
        {loading ? (
          <p className="hint">Generating fresh goal insights...</p>
        ) : error ? (
          <p className="hint">{error}</p>
        ) : (
          <ul className="ai-bullet-list">
            {insights.map((insight, index) => <li key={`${index}-${insight}`}>{insight}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
});

const MetalInsights = memo(function MetalInsights({ metals }) {
  return (
    <div className="panel section">
      <h2>Gold And Silver Insights</h2>
      {metals.map((metal) => (
        <div className="metal-row" key={metal.type}>
          <div>
            <strong>{metal.type}</strong>
            <div className="hint">Today INR {metal.today} | Prev. Close INR {metal.yesterday}</div>
          </div>
          <div className="row-title">
            {metal.change >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            <span>{metal.change >= 0 ? "+" : ""}INR {metal.change}</span>
            <span className={`badge ${metal.change >= 0 ? "green" : "red"}`}>{metal.percent}%</span>
          </div>
        </div>
      ))}
    </div>
  );
});

const HabitCalendar = memo(function HabitCalendar({ habits, transactions, emiReminders, selectedDate, visibleMonth = "", onSelectDate, onVisibleMonthChange = null }) {
  const { cells, monthLabel } = useMemo(() => {
    const current = visibleMonth
      ? new Date(`${visibleMonth}-01T12:00:00+05:30`)
      : new Date(`${selectedDate}T12:00:00+05:30`);
    const year = current.getFullYear();
    const month = current.getMonth();
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const habitByDate = Object.fromEntries(habits.map((habit) => [habit.date, habit]));
    const spendByDate = transactions.reduce((map, transaction) => {
      map[transaction.date] = (map[transaction.date] || 0) + Number(transaction.amount || 0);
      return map;
    }, {});
    const emiByDate = emiReminders.reduce((map, reminder) => {
      map[reminder.date] = (map[reminder.date] || 0) + Number(reminder.amountDue || 0);
      return map;
    }, {});
    const cells = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const habit = habitByDate[date];
      const completed = habit ? [habit.budgetAdherence, habit.spendingControl, habit.savingsAction].filter(Boolean).length : 0;
      return { key: date, date, day, completed, spent: spendByDate[date] || 0, emiDue: emiByDate[date] || 0, isToday: date === todayKey, selected: date === selectedDate };
    }),
    ];

    return {
      cells,
      monthLabel: current.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }),
      monthKey: monthKeyFromDate(current),
    };
  }, [emiReminders, habits, selectedDate, transactions, visibleMonth]);

  function shiftMonth(offset) {
    const base = visibleMonth
      ? new Date(`${visibleMonth}-01T12:00:00+05:30`)
      : new Date(`${selectedDate}T12:00:00+05:30`);
    const next = new Date(base.getFullYear(), base.getMonth() + offset, 1, 12);
    onVisibleMonthChange?.(monthKeyFromDate(next));
  }

  return (
    <div className="panel section calendar-panel">
      <div className="section-heading">
        <div>
          <h2>Calendar</h2>
          <p className="hint">{monthLabel}</p>
        </div>
        <div className="calendar-toolbar">
          <div className="calendar-nav">
            <button className="btn secondary icon" type="button" onClick={() => shiftMonth(-1)} title="Previous month">
              <span aria-hidden="true">‹</span>
            </button>
            <button className="btn secondary icon" type="button" onClick={() => shiftMonth(1)} title="Next month">
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <div className="date-picker-wrap">
          <CalendarDays size={20} />
          <input type="date" value={selectedDate} onChange={(event) => onSelectDate(event.target.value)} />
        </div>
        </div>
      </div>
      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            className={`calendar-cell ${cell.day ? "" : "empty"} ${cell.isToday ? "today" : ""} ${cell.selected ? "selected" : ""} ${cell.emiDue ? "emi-due" : ""} ${cell.completed === 3 ? "complete" : cell.completed > 0 ? "partial" : ""}`}
            disabled={!cell.day}
            onClick={() => cell.date && onSelectDate(cell.date)}
          >
            {cell.day && (
              <>
                <span>{cell.day}</span>
                <small>{cell.emiDue ? `EMI ${formatMoney(cell.emiDue)}` : cell.spent ? formatMoney(cell.spent) : cell.completed ? `${cell.completed}/3` : ""}</small>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

const DailyTransactions = memo(function DailyTransactions({ selectedDate, transactions, reminders, onDone }) {
  return (
    <div className="panel section transaction-review-panel">
      <div className="section-heading">
        <div>
          <h2>Selected Date Activity</h2>
          <p className="hint">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
      {reminders.length > 0 && (
        <div className="emi-reminder-list">
          {reminders.map((reminder) => (
            <div className="emi-reminder" key={reminder.id}>
              <CalendarDays size={17} />
              <div>
                <strong>{reminder.name} EMI due: {formatMoney(reminder.amountDue)}</strong>
                <div className="hint">{reminder.goalLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {transactions.length ? (
        <div className="transaction-edit-list">
          {transactions.map((transaction) => <EditableTransaction key={transaction.id} transaction={transaction} onDone={onDone} />)}
        </div>
      ) : (
        <div className="empty-state">No expenditure was logged on this date.</div>
      )}
    </div>
  );
});

const EditableTransaction = memo(function EditableTransaction({ transaction, categories = [], goals = [], onDone }) {
  const initialCategoryType = transaction.goalId ? goalCategoryType(transaction.goalId) : transaction.categoryType;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    categoryType: initialCategoryType,
    amount: String(transaction.amount),
    note: transaction.note || "",
  });
  const [error, setError] = useState("");
  const [noteTouched, setNoteTouched] = useState(Boolean(transaction.note));

  useEffect(() => {
    const nextCategoryType = transaction.goalId ? goalCategoryType(transaction.goalId) : transaction.categoryType;
    setForm({ categoryType: nextCategoryType, amount: String(transaction.amount), note: transaction.note || "" });
    setNoteTouched(Boolean(transaction.note));
  }, [transaction]);

  useEffect(() => {
    const goal = findGoalByCategoryType(goals, form.categoryType);
    if (!goal || noteTouched) return;
    setForm((current) => ({ ...current, note: `saved towards ${goal.name}` }));
  }, [form.categoryType, goals, noteTouched]);

  function handleCategoryChange(nextCategoryType) {
    const selectedGoal = findGoalByCategoryType(goals, nextCategoryType);
    const previousGoal = findGoalByCategoryType(goals, form.categoryType);
    const previousAutoNote = previousGoal ? `saved towards ${previousGoal.name}` : "";
    const nextAutoNote = selectedGoal ? `saved towards ${selectedGoal.name}` : "";
    const nextNote = !noteTouched && (form.note === previousAutoNote || !form.note)
      ? nextAutoNote
      : form.note;
    setForm((current) => ({ ...current, categoryType: nextCategoryType, note: nextNote }));
  }

  async function save() {
    setError("");
    const selectedGoal = findGoalByCategoryType(goals, form.categoryType);
    try {
      await api("/api/transactions", {
        method: "PATCH",
        body: JSON.stringify({
          id: transaction.id,
          categoryType: form.categoryType,
          goalId: selectedGoal?.id || "",
          amount: parseMoneyInput(form.amount),
          note: form.note,
        }),
      });
      setEditing(false);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    setError("");
    try {
      await api("/api/transactions", {
        method: "DELETE",
        body: JSON.stringify({ id: transaction.id }),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="transaction-edit-row">
      {editing ? (
        <>
          <div className="grid-2 compact">
            <div className="field">
              <label>Category</label>
              <select value={form.categoryType} onChange={(event) => handleCategoryChange(event.target.value)}>
                <optgroup label="Budget Categories">
                  {categories.map((category) => <option key={category.type} value={category.type}>{category.label}</option>)}
                </optgroup>
                {goals.length > 0 && (
                  <optgroup label="Goals">
                    {goals.map((goal) => <option key={goal.id} value={goalCategoryType(goal.id)}>{goal.name}</option>)}
                  </optgroup>
                )}
                <optgroup label="Income">
                  <option value="credit">Credit</option>
                </optgroup>
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input value={formatMoneyInput(form.amount)} inputMode="decimal" onChange={(event) => setForm({ ...form, amount: formatMoneyInput(event.target.value) })} />
            </div>
          </div>
          <div className="field">
            <label>Note</label>
            <input value={form.note} onChange={(event) => {
              setNoteTouched(true);
              setForm({ ...form, note: event.target.value });
            }} />
          </div>
          {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
          <div className="row-actions">
            <button className="btn secondary" type="button" onClick={() => setEditing(false)}><X size={16} />Cancel</button>
            <button className="btn" type="button" onClick={save}><Save size={16} />Save</button>
          </div>
        </>
      ) : (
        <>
          <div>
            <strong>{categoryLabelForTransaction(transaction, categories, goals)}</strong>
            <div className="hint">{transaction.note || "No note"}</div>
          </div>
          <div className="transaction-row-side">
            <strong>{formatMoney(transaction.amount)}</strong>
            <button className="btn secondary icon" type="button" title="Edit expenditure" onClick={() => setEditing(true)}><Pencil size={16} /></button>
            <button className="btn secondary icon danger" type="button" title="Delete expenditure" onClick={remove}><Trash2 size={16} /></button>
          </div>
          {error && <div className="alert risk transaction-error"><AlertTriangle size={18} /><span>{error}</span></div>}
        </>
      )}
    </div>
  );
});

/*
function LegacyDashboard({ summary, onDone }) {
  if (!summary) return null;
  const { profile, income, categories, ranking, recommendations, health, alerts, metals, streak } = summary;
  const chartData = categories.map((category) => ({
    name: category.label.replace(" / ", " "),
    Actual: category.spent,
    Expected: category.expected,
    Limit: category.monthlyLimit,
    type: category.type,
  }));
  const pieData = categories.map((category) => ({ name: category.label, value: category.monthlyLimit, type: category.type }));

  return (
    <div className="dashboard">
      <section className="summary-grid">
        <div className="panel metric">
          <div className="score-wrap">
            <div className="score-gauge" style={{ "--score": health.score }}>
              <svg viewBox="0 0 188 112" role="img" aria-label={`Financial health score ${health.score} out of 100`}>
                <path className="score-track" d="M 28 88 A 66 66 0 0 1 160 88" pathLength="100" />
                <path className="score-progress" d="M 28 88 A 66 66 0 0 1 160 88" pathLength="100" />
              </svg>
              <div className="score-value">
                <span>{health.score}</span>
                <small>/100</small>
              </div>
            </div>
            <div>
              <h2>{health.category}</h2>
              <p className="hint">Financial health score for {profile.name}. Mode: {profile.mode}.</p>
            </div>
          </div>
        </div>
        <Metric icon={<IndianRupee size={19} />} label="Monthly Income" value={formatMoney(income.monthlyIncome)} />
        <Metric icon={<AlertTriangle size={19} />} label="Top Risk" value={ranking[0]?.label || "None"} />
        <Metric icon={<Check size={19} />} label="Habit Streak" value={`${streak} days`} />
      </section>

      {alerts.length > 0 && (
        <section className="panel section">
          <h2>Assistant Alerts</h2>
          <div className="recommendations">
            {alerts.map((alert) => <div key={alert.message} className={`alert ${alert.level}`}>{alert.message}</div>)}
          </div>
        </section>
      )}

      <section className="grid-2">
        <div className="panel section">
          <h2>Category Tracking</h2>
          <div className="category-list">
            {categories.map((category) => <CategoryRow key={category.id} category={category} />)}
          </div>
        </div>
        <TransactionForm onDone={onDone} />
      </section>

      <section className="grid-2">
        <div className="panel section">
          <h2>Actual vs Expected</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                <Bar dataKey="Actual" fill="#245b7a" />
                <Bar dataKey="Expected" fill="#9a6a13" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel section">
          <h2>Budget Allocation</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={105} label={(entry) => entry.name.split(" ")[0]}>
                  {pieData.map((entry) => <Cell key={entry.type} fill={categoryColors[entry.type]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel section">
          <h2>Top Problem Categories</h2>
          <div className="ranking">
            {ranking.map((item) => (
              <div className="rank-item" key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <div className="hint">Risk score {(item.riskScore || 0).toFixed(2)} using weight {item.weight}</div>
                </div>
                <span className={`badge ${item.status}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel section">
          <h2>Recommendations</h2>
          <div className="recommendations">
            {recommendations.map((rec) => (
              <div className={`recommendation ${rec.severity}`} key={rec.id}>
                <strong>{rec.title}</strong>
                <p className="hint">{rec.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-2">
        <HabitPanel onDone={onDone} />
        <div className="panel section">
          <h2>Gold And Silver Insights</h2>
          {metals.map((metal) => (
            <div className="metal-row" key={metal.type}>
              <div>
                <strong>{metal.type}</strong>
                <div className="hint">Today ₹{metal.today} • Prev. Close ₹{metal.yesterday}</div>
              </div>
              <div className="row-title">
                {metal.change >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                <span>{metal.change >= 0 ? "+" : ""}₹{metal.change}</span>
                <span className={`badge ${metal.change >= 0 ? "green" : "red"}`}>{metal.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

*/

const Metric = memo(function Metric({ icon, label, value, hint = "", valueClassName = "" }) {
  return (
    <div className="panel metric">
      <div className="row-title">{icon}<span>{label}</span></div>
      <div className={`metric-value ${valueClassName}`.trim()}>{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
});

const CategoryRow = memo(function CategoryRow({ category }) {
  const isDebt = category.type === "debt";
  return (
    <div className="category-row">
      <div>
        <div className="row-title">
          <span>{category.label}</span>
          <StatusBadge status={category.status} />
          <span className="badge green">{category.priority}</span>
        </div>
        <div className="bar">
          <span style={{ width: `${category.progress}%`, background: categoryColors[category.type] || "#8B5CF6" }} />
        </div>
        <div className="money-row">
          <span>{isDebt ? "Target" : "Limit"} {formatMoney(category.monthlyLimit)}</span>
          <span>{isDebt ? "Repaid" : "Spent"} {formatMoney(category.spent)}</span>
          <span>Expected {formatMoney(category.expected)}</span>
          <span>{isDebt ? "Due left" : "Remaining"} {formatMoney(category.remaining)}</span>
        </div>
      </div>
      <CircleDollarSign color={categoryColors[category.type] || "#8B5CF6"} />
    </div>
  );
});

function StatusBadge({ status }) {
  const icon = status === "green" ? <Check size={13} /> : <AlertTriangle size={13} />;
  const label = status === "green" ? "On track" : status === "orange" ? "Warning" : "Over limit";
  return <span className={`badge status ${status}`}>{icon}{label}</span>;
}

const TransactionForm = memo(function TransactionForm({ categories = [], goals = [], selectedDate = "", onDone }) {
  const categoryOptions = useMemo(() => buildTransactionCategories(categories, goals), [categories, goals]);
  const defaultCategoryType = categoryOptions[0]?.type || "essentials";
  const [form, setForm] = useState({ categoryType: defaultCategoryType, amount: "", note: "", date: selectedDate || new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);

  useEffect(() => {
    if (!categoryOptions.some((category) => category.type === form.categoryType)) {
      setForm((current) => ({ ...current, categoryType: defaultCategoryType }));
    }
  }, [categoryOptions, defaultCategoryType, form.categoryType]);

  useEffect(() => {
    if (selectedDate) setForm((current) => ({ ...current, date: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    const goal = findGoalByCategoryType(goals, form.categoryType);
    if (!goal || noteTouched) return;
    setForm((current) => ({ ...current, note: `saved towards ${goal.name}` }));
  }, [form.categoryType, goals, noteTouched]);

  function handleCategoryChange(nextCategoryType) {
    const selectedGoal = findGoalByCategoryType(goals, nextCategoryType);
    const previousGoal = findGoalByCategoryType(goals, form.categoryType);
    const previousAutoNote = previousGoal ? `saved towards ${previousGoal.name}` : "";
    const nextAutoNote = selectedGoal ? `saved towards ${selectedGoal.name}` : "";
    const nextNote = !noteTouched && (form.note === previousAutoNote || !form.note)
      ? nextAutoNote
      : form.note;
    setForm((current) => ({ ...current, categoryType: nextCategoryType, note: nextNote }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const selectedGoal = findGoalByCategoryType(goals, form.categoryType);
    try {
      await api("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          goalId: selectedGoal?.id || "",
          amount: parseMoneyInput(form.amount),
        }),
      });
      setForm((current) => ({ ...current, amount: "", note: "", categoryType: defaultCategoryType }));
      setNoteTouched(false);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel section">
      <h2>Add Daily Activity</h2>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Category</label>
          <select value={form.categoryType} onChange={(event) => handleCategoryChange(event.target.value)}>
            <optgroup label="Budget Categories">
              {(categories.length ? categories : Object.entries(categoryLabels).filter(([value]) => value !== "credit").map(([type, label]) => ({ type, label }))).map((category) => (
                <option key={category.type} value={category.type}>{category.label}</option>
              ))}
            </optgroup>
            {goals.length > 0 && (
              <optgroup label="Goals">
                {goals.map((goal) => <option key={goal.id} value={goalCategoryType(goal.id)}>{goal.name}</option>)}
              </optgroup>
            )}
            <optgroup label="Income">
              <option value="credit">Credit</option>
            </optgroup>
          </select>
        </div>
        <div className="field">
          <label>Amount</label>
          <input value={formatMoneyInput(form.amount)} inputMode="decimal" onChange={(event) => setForm({ ...form, amount: formatMoneyInput(event.target.value) })} required />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
        </div>
        <div className="field">
          <label>Note</label>
          <input value={form.note} onChange={(event) => {
            setNoteTouched(true);
            setForm({ ...form, note: event.target.value });
          }} placeholder="Groceries, EMI, savings transfer..." />
        </div>
        {error && <div className="alert risk">{error}</div>}
        <button className="btn" type="submit">
          <Plus size={17} />
          Add activity
        </button>
      </form>
    </section>
  );
});

const HabitPanel = memo(function HabitPanel({ categories }) {
  const suggestedHabit = useMemo(() => {
    const lifestyle = categories.find((category) => category.type === "lifestyle");
    const savings = categories.find((category) => category.type === "savings");
    const overBudget = categories.some((category) => category.status === "red");
    const avoidableOverspend = lifestyle ? ["orange", "red"].includes(lifestyle.status) : false;
    const protectedSavings = savings ? savings.spent > 0 || savings.status === "green" : false;
    return {
      budgetAdherence: !overBudget,
      spendingControl: !avoidableOverspend,
      savingsAction: protectedSavings,
    };
  }, [categories]);
  const completed = useMemo(() => Object.values(suggestedHabit).filter(Boolean).length, [suggestedHabit]);
  const achievements = [
    ["budgetAdherence", "Budget Keeper", CircleGauge],
    ["spendingControl", "Spending Control", Target],
    ["savingsAction", "Savings Progress", Medal],
  ];

  return (
    <section className="panel section">
      <h2>Daily Habit Tracking</h2>
      <p className="hint">Achievements update automatically from your current spending status.</p>
      <div className="habits">
        {achievements.map(([key, label, Icon]) => (
          <div className={`habit-row achievement ${suggestedHabit[key] ? "earned" : ""}`} key={key}>
            <span className="achievement-icon"><Icon size={20} /></span>
            <span>{label}</span>
            <span className="badge green">{suggestedHabit[key] ? "Earned" : "Pending"}</span>
          </div>
        ))}
      </div>
      <p className="hint">{completed}/3 achievements earned today.</p>
    </section>
  );
});

const SettingsPage = memo(function SettingsPage({ user, profile, income, onDone }) {
  const [form, setForm] = useState({
    name: profile?.name || "",
    email: user?.email || "",
    password: "",
    incomePeriod: income?.period || "monthly",
    incomeAmount: income?.amount ? String(income.amount) : "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [setupResetting, setSetupResetting] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      email: user?.email || "",
      password: "",
      incomePeriod: income?.period || "monthly",
      incomeAmount: income?.amount ? String(income.amount) : "",
    });
  }, [income, profile, user]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() === user?.email ? "" : form.email.trim(),
        password: form.password,
        incomePeriod: form.incomePeriod,
        incomeAmount: parseMoneyInput(form.incomeAmount),
      };
      const result = await api("/api/profile", { method: "PATCH", body: JSON.stringify(payload) });
      setMessage(result.message);
      setForm({ ...form, password: "" });
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resetSetup() {
    if (!window.confirm("Run setup again? This reopens onboarding for your profile, income, budget, debt, and savings setup while keeping your transactions, goals, habits, investments, and assistant history.")) return;
    setError("");
    setMessage("");
    setSetupResetting(true);
    try {
      clearPortfolioSessionCache();
      const result = await api("/api/profile/restart-setup", { method: "POST" });
      setMessage(result.message);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSetupResetting(false);
    }
  }

  async function clearData() {
    if (!window.confirm("Clear all data and start over? This wipes every saved Finova record for this account and sends you back to setup.")) return;
    setError("");
    setMessage("");
    setClearingData(true);
    try {
      clearPortfolioSessionCache();
      const result = await api("/api/profile/reset-setup", { method: "POST" });
      setMessage(result.message);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setClearingData(false);
    }
  }

  async function loadDemoProfile() {
    if (!window.confirm("Replace the current account data with the Maggi demo profile? This clears the existing account data and loads the full demo dataset.")) return;
    setError("");
    setMessage("");
    setLoadingDemo(true);
    try {
      clearPortfolioSessionCache();
      const result = await api("/api/profile/demo-profile", { method: "POST" });
      setMessage(result.message);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDemo(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Permanently delete your Finova account and all saved financial data? This cannot be undone.")) return;
    setError("");
    setMessage("");
    setDeletingAccount(true);
    try {
      await api("/api/profile", { method: "DELETE" });
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="dashboard-page settings-grid">
      <section className="panel section settings-panel">
        <div className="section-heading">
          <div>
            <h2>Profile Settings</h2>
            <p className="hint">Update your profile, income, and account credentials.</p>
          </div>
          <Settings size={20} />
        </div>
        <form className="form" onSubmit={submit}>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </div>
          </div>
          <div className="field">
            <label>Income</label>
            <div className="grid-2 compact">
              <select value={form.incomePeriod} onChange={(event) => setForm({ ...form, incomePeriod: event.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
              <input value={formatMoneyInput(form.incomeAmount)} inputMode="decimal" onChange={(event) => setForm({ ...form, incomeAmount: formatMoneyInput(event.target.value) })} required />
            </div>
          </div>
          <div className="field">
            <label>New Password</label>
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave blank to keep current password" />
              <button type="button" className="field-icon-button" title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {message && <div className="alert info"><Check size={18} /><span>{message}</span></div>}
          {error && <div className="alert risk"><AlertTriangle size={18} /><span>{error}</span></div>}
          <button className="btn" type="submit" disabled={submitting}>
            <Save size={17} />
            {submitting ? "Saving..." : "Save settings"}
          </button>
        </form>
      </section>
      <section className="panel section settings-panel danger-zone">
        <div className="section-heading">
          <div>
            <h2>Account Actions</h2>
            <p className="hint">Restart onboarding, wipe app data, or permanently remove this account.</p>
          </div>
          <AlertTriangle size={20} />
        </div>
        <div className="settings-actions">
          <button className="btn secondary" type="button" onClick={resetSetup} disabled={setupResetting || loadingDemo || clearingData || deletingAccount}>
            <RefreshCcw size={17} />
            {setupResetting ? "Resetting..." : "Run setup again"}
          </button>
          <button className="btn secondary" type="button" onClick={loadDemoProfile} disabled={setupResetting || loadingDemo || clearingData || deletingAccount}>
            <Sparkles size={17} />
            {loadingDemo ? "Loading demo..." : "Load demo profile"}
          </button>
          <button className="btn secondary danger" type="button" onClick={clearData} disabled={setupResetting || loadingDemo || clearingData || deletingAccount}>
            <Trash2 size={17} />
            {clearingData ? "Clearing..." : "Clear data"}
          </button>
          <button className="btn secondary danger" type="button" onClick={deleteAccount} disabled={setupResetting || loadingDemo || clearingData || deletingAccount}>
            <Trash2 size={17} />
            {deletingAccount ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
});
