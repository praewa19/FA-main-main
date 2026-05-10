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

const DashboardPage = memo(function DashboardPage({ categories, chartData, pieData, health }) {
  return (
    <div className="dashboard-page dashboard-clean">
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
        <ActualExpectedLineChart chartData={chartData} />
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
          const remaining = category.monthlyLimit - category.spent;
          return (
            <div className="allocation-tile" key={category.id}>
              <div className="allocation-tile-top">
                <strong>{category.label.replace(" / Discretionary", "")}</strong>
                <span>{Math.min(100, percentage)}%</span>
              </div>
              <div className="allocation-track">
                <span style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, background: categoryColors[category.type] || "#8B5CF6" }} />
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

  const [incomeForm, setIncomeForm] = useState({ incomePeriod: income.period, incomeAmount: String(income.amount) });
  const [editingIncome, setEditingIncome] = useState(false);
  const [draft, setDraft] = useState(() => buildDraft(categories));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const total = draft.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
  const chartData = draft.map((category) => ({
    type: category.type,
    name: category.label,
    value: Math.round((income.monthlyIncome * Number(category.percentage || 0)) / 100),
    percent: Number(category.percentage || 0),
  }));

  useEffect(() => {
    setIncomeForm({ incomePeriod: income.period, incomeAmount: String(income.amount) });
    setDraft(buildDraft(categories));
  }, [categories, income, savingsGuidance]);

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
      await api("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({
          ...incomeForm,
          incomeAmount: Number(incomeForm.incomeAmount),
          categories: draft,
          changedType,
        }),
      });
      setMessage("Budget saved and backend updated.");
      setEditingIncome(false);
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
            <button className="btn secondary" type="button" onClick={() => setEditingIncome(!editingIncome)}><Pencil size={16} />Edit</button>
          </div>
          {editingIncome && (
            <div className="income-edit-panel">
              <div className="grid-2 compact">
                <select value={incomeForm.incomePeriod} onChange={(event) => setIncomeForm({ ...incomeForm, incomePeriod: event.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
                <input type="number" min="1" value={incomeForm.incomeAmount} onChange={(event) => setIncomeForm({ ...incomeForm, incomeAmount: event.target.value })} />
              </div>
              <button className="btn" type="button" onClick={() => save()}><Save size={17} />Save income</button>
            </div>
          )}
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
      <section className="panel section ai-panel">
        <div className="ai-icon"><Sparkles size={22} /></div>
        <div>
          <h2>AI Insights</h2>
          <ul className="ai-bullet-list">
            <li>Essentials: keep core expenses within the planned allocation.</li>
            <li>Savings: target {Math.round((savingsGuidance?.recommendedSavingsRate || 0.2) * 100)}% monthly, about {formatMoney(savingsGuidance?.recommendedMonthlySavings || 0)}.</li>
            {recommendations.slice(0, 2).map((rec) => <li key={rec.id}>{rec.title}: {rec.body}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
});

const ActualExpectedLineChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.ActualExpectedLineChart), {
  loading: () => <ChartSkeleton title="Spending Analytics" />,
  ssr: false,
});

const BudgetAllocationChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.BudgetAllocationChart), {
  loading: () => <ChartSkeleton title="Budget Allocation" />,
  ssr: false,
});

const CategoryDistributionChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.CategoryDistributionChart), {
  loading: () => <ChartSkeleton title="Category Distribution" />,
  ssr: false,
});

const BehaviorRadarChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.BehaviorRadarChart), {
  loading: () => <ChartSkeleton title="Behavior Analysis" />,
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

const goalEmojiOptions = ["💰", "🏠", "🚗", "✈️", "🎓", "💻", "💍", "🏖️", "📈", "🛡️", "🎯", "⭐"];

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
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
    try {
      await api("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          incomeAmount: Number(form.incomeAmount),
          debt: form.hasDebt ? {
            ...form.debt,
            originalAmount: Number(form.debt.originalAmount),
            annualInterestRate: Number(form.debt.annualInterestRate || 0),
            remainingMonths: Number(form.debt.remainingMonths),
            amountRepaid: Number(form.debt.amountRepaid || 0),
            emiDay: Number(form.debt.emiDay),
          } : undefined,
          goal: form.goal.name ? {
            ...form.goal,
            target: Number(form.goal.target),
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
            <input type="date" value={form.birthdate} onChange={(event) => setForm({ ...form, birthdate: event.target.value })} required />
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
            <input type="number" min="1" value={form.incomeAmount} onChange={(event) => setForm({ ...form, incomeAmount: event.target.value })} required />
          </div>
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
                <input type="number" min="1" value={form.debt.originalAmount} onChange={(event) => setForm({ ...form, debt: { ...form.debt, originalAmount: event.target.value } })} required={form.hasDebt} />
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
                <input type="number" min="0" value={form.debt.amountRepaid} onChange={(event) => setForm({ ...form, debt: { ...form.debt, amountRepaid: event.target.value } })} placeholder="0" required={form.hasDebt} />
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
              <input type="number" min="1" value={form.goal.target} onChange={(event) => setForm({ ...form, goal: { ...form.goal, target: event.target.value } })} />
            </div>
            <div className="field">
              <label>Finish By</label>
              <input type="date" value={form.goal.deadline} onChange={(event) => setForm({ ...form, goal: { ...form.goal, deadline: event.target.value } })} />
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
  ["settings", Settings, "Settings"],
];

const Dashboard = memo(function Dashboard({ user, summary, activeTab, isTabPending, onTab, onRefresh, onLogout, onDone }) {
  if (!summary) return null;
  const { profile, income, categories, ranking, recommendations, health, alerts, metals, streak, habits, transactions, debtObligations, emiReminders, goals = [], savingsTargets = [], customHabits = [], totals, savingsGuidance } = summary;
  const chartData = useMemo(() => categories.map((category) => ({
    name: category.label.replace(" / ", " "),
    Actual: category.spent,
    Expected: category.expected,
    Limit: category.monthlyLimit,
    type: category.type,
  })), [categories]);
  const pieData = useMemo(() => categories.map((category) => ({
    name: category.label,
    value: category.monthlyLimit,
    spent: category.spent,
    type: category.type,
    percent: income.monthlyIncome ? (category.monthlyLimit / income.monthlyIncome) * 100 : 0,
  })), [categories, income.monthlyIncome]);
  const activeLabel = navItems.find(([key]) => key === activeTab)?.[2] || "Overview";

  if (activeTab === "overview") {
    return (
      <div className={`standalone-overview tab-panel ${isTabPending ? "pending" : ""}`}>
        <OverviewPage profile={profile} income={income} health={health} alerts={alerts} recommendations={recommendations} goals={goals} savingsGuidance={savingsGuidance} onTab={onTab} />
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
          <div>
            <h1>{activeLabel}</h1>
            <p className="hint">{profile.name}'s financial workspace</p>
          </div>
          <div className="top-actions">
            <button className="btn secondary icon" title="Refresh dashboard" onClick={onRefresh}><RefreshCcw size={17} /></button>
            <button className="avatar-button" title={user.email} onClick={() => onTab("settings")}><User size={17} /></button>
            <button className="btn secondary" onClick={onLogout}><LogOut size={17} />Logout</button>
          </div>
        </header>
        <div className={`tab-panel ${isTabPending ? "pending" : ""}`}>
          {activeTab === "dashboard" && <DashboardPage categories={categories} chartData={chartData} pieData={pieData} health={health} />}
          {activeTab === "budget" && <BudgetPage income={income} categories={categories} hasDebt={profile.hasDebt} savingsGuidance={savingsGuidance} recommendations={recommendations} onDone={onDone} />}
          {activeTab === "transactions" && <TransactionsPage transactions={transactions || []} categories={categories} emiReminders={emiReminders || []} totals={totals} onDone={onDone} />}
          {activeTab === "goals" && <GoalsPage goals={goals} recommendations={recommendations} onDone={onDone} />}
          {activeTab === "habits" && <HabitsPage customHabits={customHabits} habits={habits} categories={categories} onDone={onDone} />}
          {activeTab === "savings" && <SavingsPage savingsTargets={savingsTargets} savingsGuidance={savingsGuidance} income={income} onDone={onDone} />}
          {activeTab === "analytics" && <AnalyticsPage categories={categories} transactions={transactions || []} health={health} income={income} savingsGuidance={savingsGuidance} goals={goals} />}
          {activeTab === "investments" && <InvestmentsPage metals={metals} />}
          {activeTab === "settings" && <SettingsPage user={user} profile={profile} income={income} onDone={onDone} />}
        </div>
      </section>
    </div>
  );
});

const TransactionsPage = memo(function TransactionsPage({ transactions, categories, emiReminders, totals, onDone }) {
  const [selectedDate, setSelectedDate] = useState("");
  const visible = selectedDate ? transactions.filter((transaction) => transaction.date === selectedDate) : transactions;
  const totalCredits = totals?.totalCredits || transactions.filter((t) => t.categoryType === "credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = totals?.totalExpenses || transactions.filter((t) => t.categoryType !== "credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totals?.netBalance || totalCredits - totalExpenses;

  return (
    <div className="dashboard-page">
      <section className="transactions-top">
        <HabitCalendar habits={[]} transactions={transactions} emiReminders={emiReminders} selectedDate={selectedDate || new Date().toISOString().slice(0, 10)} onSelectDate={setSelectedDate} />
        <TransactionForm categories={categories} selectedDate={selectedDate} onDone={onDone} />
      </section>
      <section className="summary-grid three">
        <Metric icon={<TrendingUp size={19} />} label="Total Income" value={formatMoney(totalCredits)} />
        <Metric icon={<TrendingDown size={19} />} label="Total Expenses" value={formatMoney(totalExpenses)} />
        <Metric icon={<Activity size={19} />} label="Net Balance" value={formatMoney(netBalance)} />
      </section>
      <section className="panel section">
        <div className="section-heading">
          <div><h2>Transaction List</h2><p className="hint">{selectedDate ? `Showing ${selectedDate}` : "Showing every transaction"}</p></div>
          {selectedDate && <button className="btn secondary" type="button" onClick={() => setSelectedDate("")}>Show all</button>}
        </div>
        <div className="transaction-edit-list">
          {visible.length ? visible.map((transaction) => <EditableTransaction key={transaction.id} transaction={transaction} categories={categories} onDone={onDone} />) : <div className="empty-state">No transactions found.</div>}
        </div>
      </section>
    </div>
  );
});

const GoalsPage = memo(function GoalsPage({ goals, recommendations, onDone }) {
  const [form, setForm] = useState({ name: "", emoji: "💰", target: "", current: "0", deadline: "", priority: "medium" });
  const [error, setError] = useState("");

  async function addGoal(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/goals", { method: "POST", body: JSON.stringify({ ...form, target: Number(form.target), current: Number(form.current) }) });
      setForm({ name: "", emoji: "💰", target: "", current: "0", deadline: "", priority: "medium" });
      await onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard-page">
      <section className="panel section">
        <div className="section-heading"><div><h2>Financial Goals</h2><p className="hint">Track your progress toward important money targets.</p></div></div>
        <form className="goal-form" onSubmit={addGoal}>
          <input placeholder="Goal" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <div className="goal-emoji-field">
            <input placeholder="Icon" value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} required />
            <EmojiPicker value={form.emoji} onChange={(emoji) => setForm({ ...form, emoji })} />
          </div>
          <input type="number" min="1" placeholder="Target Amount" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} required />
          <input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} required />
          <button className="btn" type="submit"><Plus size={17} />Add Goal</button>
        </form>
        {error && <div className="alert risk">{error}</div>}
      </section>
      <section className="goal-grid">
        {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onDone={onDone} />)}
      </section>
      <RecommendationsPanel recommendations={recommendations.slice(0, 3)} />
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
  async function remove() {
    await api("/api/goals", { method: "DELETE", body: JSON.stringify({ id: goal.id }) });
    await onDone();
  }
  return (
    <article className="panel section goal-card">
      <div className="section-heading"><div className="goal-title"><span>{goal.emoji}</span><div><h2>{goal.name}</h2><p className="hint">{daysLeft} days left</p></div></div><button className="btn secondary icon danger" onClick={remove} title="Delete goal"><Trash2 size={16} /></button></div>
      <div className="bar large"><span style={{ width: `${progress}%`, background: "#8B5CF6" }} /></div>
      <div className="money-row"><span>{formatMoney(goal.current)} saved</span><span>{formatMoney(goal.target)} target</span><span>{progress}%</span></div>
    </article>
  );
}

const HabitsPage = memo(function HabitsPage({ customHabits, habits, categories, onDone }) {
  const [form, setForm] = useState({ name: "", description: "", icon: "*", targetDays: 30 });
  const completedToday = customHabits.filter((habit) => habit.completedToday).length;
  const totalStreak = customHabits.reduce((sum, habit) => sum + Number(habit.streak || 0), 0);

  async function addHabit(event) {
    event.preventDefault();
    await api("/api/custom-habits", { method: "POST", body: JSON.stringify(form) });
    setForm({ name: "", description: "", icon: "*", targetDays: 30 });
    await onDone();
  }

  async function toggle(habit) {
    await api("/api/custom-habits", { method: "PATCH", body: JSON.stringify({ ...habit, completedToday: !habit.completedToday, streak: habit.completedToday ? Math.max(0, habit.streak - 1) : habit.streak + 1 }) });
    await onDone();
  }

  return (
    <div className="dashboard-page">
      <section className="summary-grid three">
        <Metric icon={<FlameIcon />} label="Total Streak" value={`${totalStreak} days`} />
        <Metric icon={<Check size={19} />} label="Completed Today" value={`${completedToday}/${customHabits.length || 0}`} />
        <Metric icon={<Medal size={19} />} label="Achievements" value={`${habits.length} logs`} />
      </section>
      <section className="panel section">
        <h2>Today's Habits</h2>
        <form className="goal-form" onSubmit={addHabit}>
          <input placeholder="Habit" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input placeholder="Icon" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          <input type="number" min="1" max="365" value={form.targetDays} onChange={(event) => setForm({ ...form, targetDays: Number(event.target.value) })} />
          <button className="btn" type="submit"><Plus size={17} />Add Habit</button>
        </form>
        <div className="habits editable">
          {(customHabits.length ? customHabits : []).map((habit) => (
            <div className={`habit-row achievement ${habit.completedToday ? "earned" : ""}`} key={habit.id}>
              <span className="achievement-icon">{habit.icon}</span>
              <div><strong>{habit.name}</strong><p className="hint">{habit.description}</p></div>
              <span className="badge green">{habit.streak}/{habit.targetDays}</span>
              <button className="btn secondary icon" onClick={() => toggle(habit)} title="Toggle habit">{habit.completedToday ? <Check size={16} /> : <X size={16} />}</button>
            </div>
          ))}
        </div>
      </section>
      <HabitPanel categories={categories} />
    </div>
  );
});

function FlameIcon() {
  return <Zap size={19} />;
}

const SavingsPage = memo(function SavingsPage({ savingsTargets, savingsGuidance, income, onDone }) {
  const [form, setForm] = useState({ name: "", target: "", current: "0", monthlyContribution: savingsGuidance?.recommendedMonthlySavings || 0, deadline: "" });
  async function add(event) {
    event.preventDefault();
    await api("/api/savings", { method: "POST", body: JSON.stringify({ ...form, target: Number(form.target), current: Number(form.current), monthlyContribution: Number(form.monthlyContribution) }) });
    setForm({ name: "", target: "", current: "0", monthlyContribution: savingsGuidance?.recommendedMonthlySavings || 0, deadline: "" });
    await onDone();
  }
  return (
    <div className="dashboard-page">
      <section className="panel section savings-shell">
        <h2>Savings Plan</h2>
        <p className="hint">Recommended target for age {savingsGuidance?.age || "profile"} is {Math.round((savingsGuidance?.recommendedSavingsRate || 0.2) * 100)}% of monthly income: {formatMoney(savingsGuidance?.recommendedMonthlySavings || income.monthlyIncome * 0.2)}.</p>
        <form className="goal-form" onSubmit={add}>
          <input placeholder="What are you saving for?" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input type="number" min="1" placeholder="Target" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} required />
          <input type="number" min="0" placeholder="Current" value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} />
          <input type="number" min="0" placeholder="Monthly" value={form.monthlyContribution} onChange={(event) => setForm({ ...form, monthlyContribution: event.target.value })} />
          <button className="btn" type="submit"><Plus size={17} />Add Savings</button>
        </form>
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

const AnalyticsPage = memo(function AnalyticsPage({ categories, transactions, health, income, savingsGuidance, goals }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({ day, spending: 0 }));
  transactions.filter((transaction) => transaction.categoryType !== "credit").forEach((transaction) => {
    days[new Date(`${transaction.date}T12:00:00`).getDay()].spending += Number(transaction.amount || 0);
  });
  const behavior = [
    { metric: "Savings Rate", score: Math.round(health.components.savingsScore) },
    { metric: "Budget", score: Math.round(health.components.spendingScore) },
    { metric: "Debt", score: Math.round(health.components.debtScore) },
    { metric: "Habits", score: Math.round(health.components.habitsScore) },
  ];
  const expenses = transactions.filter((t) => t.categoryType !== "credit").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const forecast = Math.round(expenses * 1.08);
  return (
    <div className="dashboard-page">
      <section className="summary-grid">
        <Metric icon={<TrendingUp size={19} />} label="Avg Monthly Savings" value={formatMoney(savingsGuidance?.recommendedMonthlySavings || 0)} />
        <Metric icon={<CalendarDays size={19} />} label="Highest Spend Day" value={days.sort((a, b) => b.spending - a.spending)[0]?.day || "None"} />
        <Metric icon={<Activity size={19} />} label="Budget Score" value={`${health.score}/100`} />
        <Metric icon={<AlertTriangle size={19} />} label="Savings Gap" value={formatMoney(Math.max(0, (savingsGuidance?.recommendedMonthlySavings || 0) - (categories.find((c) => c.type === "savings")?.spent || 0)))} />
      </section>
      <section className="analytics-grid">
        <div className="panel section"><h2>Financial Behavior Analysis</h2><BehaviorRadarChart data={behavior} /></div>
        <ActualExpectedChart chartData={categories.map((category) => ({ name: category.label, Actual: category.spent, Expected: category.expected }))} />
      </section>
      <section className="panel section prediction-grid">
        <h2>Predictive Analytics</h2>
        <div className="summary-grid three">
          <Metric icon={<CalendarDays size={19} />} label="Next Month Forecast" value={formatMoney(forecast)} />
          <Metric icon={<TrendingUp size={19} />} label="Savings Potential" value={formatMoney(Math.max(0, income.monthlyIncome - forecast))} />
          <Metric icon={<Target size={19} />} label="Goal Count" value={`${goals.length} active`} />
        </div>
      </section>
    </div>
  );
});

const InvestmentsPage = memo(function InvestmentsPage({ metals }) {
  return (
    <div className="dashboard-page">
      <section className="panel section shell-page">
        <h2>Investments</h2>
        <p className="hint">Investment tracking shell. We will build portfolio, allocation, and market integrations next.</p>
        <div className="metal-list">{metals.map((metal) => <div className="metal-row" key={metal.type}><strong>{metal.type}</strong><span className={`badge ${metal.change >= 0 ? "green" : "red"}`}>{metal.percent}%</span></div>)}</div>
      </section>
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

const RecommendationsPanel = memo(function RecommendationsPanel({ recommendations }) {
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

const MetalInsights = memo(function MetalInsights({ metals }) {
  return (
    <div className="panel section">
      <h2>Gold And Silver Insights</h2>
      {metals.map((metal) => (
        <div className="metal-row" key={metal.type}>
          <div>
            <strong>{metal.type}</strong>
            <div className="hint">Today INR {metal.today} | Yesterday INR {metal.yesterday}</div>
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

const HabitCalendar = memo(function HabitCalendar({ habits, transactions, emiReminders, selectedDate, onSelectDate }) {
  const { cells, monthLabel } = useMemo(() => {
    const current = new Date(`${selectedDate}T12:00:00`);
    const year = current.getFullYear();
    const month = current.getMonth();
    const todayKey = new Date().toISOString().slice(0, 10);
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
      today: current,
      cells,
      monthLabel: current.toLocaleString("en", { month: "long", year: "numeric" }),
    };
  }, [emiReminders, habits, selectedDate, transactions]);

  return (
    <div className="panel section calendar-panel">
      <div className="section-heading">
        <div>
          <h2>Calendar</h2>
          <p className="hint">{monthLabel}</p>
        </div>
        <div className="date-picker-wrap">
          <CalendarDays size={20} />
          <input type="date" value={selectedDate} onChange={(event) => onSelectDate(event.target.value)} />
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

const EditableTransaction = memo(function EditableTransaction({ transaction, categories = [], onDone }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    categoryType: transaction.categoryType,
    amount: String(transaction.amount),
    note: transaction.note || "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ categoryType: transaction.categoryType, amount: String(transaction.amount), note: transaction.note || "" });
  }, [transaction]);

  async function save() {
    setError("");
    try {
      await api("/api/transactions", {
        method: "PATCH",
        body: JSON.stringify({ id: transaction.id, ...form, amount: Number(form.amount) }),
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
              <select value={form.categoryType} onChange={(event) => setForm({ ...form, categoryType: event.target.value })}>
                {[...categories.map((category) => [category.type, category.label]), ["credit", "Credit"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Note</label>
            <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
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
            <strong>{categories.find((category) => category.type === transaction.categoryType)?.label || categoryLabels[transaction.categoryType] || transaction.categoryType}</strong>
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
                <div className="hint">Today ₹{metal.today} • Yesterday ₹{metal.yesterday}</div>
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

const Metric = memo(function Metric({ icon, label, value }) {
  return (
    <div className="panel metric">
      <div className="row-title">{icon}<span>{label}</span></div>
      <div className="metric-value">{value}</div>
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

const TransactionForm = memo(function TransactionForm({ categories = [], selectedDate = "", onDone }) {
  const [form, setForm] = useState({ categoryType: "essentials", amount: "", note: "", date: selectedDate || new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedDate) setForm((current) => ({ ...current, date: selectedDate }));
  }, [selectedDate]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/transactions", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      setForm({ ...form, amount: "", note: "" });
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
          <select value={form.categoryType} onChange={(event) => setForm({ ...form, categoryType: event.target.value })}>
            {(categories.length ? categories : Object.entries(categoryLabels).filter(([value]) => value !== "credit").map(([type, label]) => ({ type, label }))).map((category) => (
              <option key={category.type} value={category.type}>{category.label}</option>
            ))}
            <option value="credit">Credit</option>
          </select>
        </div>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
        </div>
        <div className="field">
          <label>Note</label>
          <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Groceries, EMI, savings transfer..." />
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
        incomeAmount: Number(form.incomeAmount),
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
    if (!window.confirm("Run setup again? Your current profile, income, budget plan, and debt setup will be cleared.")) return;
    setError("");
    setMessage("");
    setSetupResetting(true);
    try {
      const result = await api("/api/profile/reset-setup", { method: "POST" });
      setMessage(result.message);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSetupResetting(false);
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
              <input type="number" min="1" value={form.incomeAmount} onChange={(event) => setForm({ ...form, incomeAmount: event.target.value })} required />
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
            <p className="hint">Restart setup or permanently remove this account.</p>
          </div>
          <AlertTriangle size={20} />
        </div>
        <div className="settings-actions">
          <button className="btn secondary" type="button" onClick={resetSetup} disabled={setupResetting || deletingAccount}>
            <RefreshCcw size={17} />
            {setupResetting ? "Resetting..." : "Run setup again"}
          </button>
          <button className="btn secondary danger" type="button" onClick={deleteAccount} disabled={setupResetting || deletingAccount}>
            <Trash2 size={17} />
            {deletingAccount ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
});
