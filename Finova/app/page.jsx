"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CircleGauge,
  Check,
  CircleDollarSign,
  Coins,
  Eye,
  EyeOff,
  IndianRupee,
  KeyRound,
  Medal,
  LogOut,
  Mail,
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
  X,
} from "lucide-react";

const ActualExpectedChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.ActualExpectedChart), {
  loading: () => <ChartSkeleton title="Actual vs Expected" />,
  ssr: false,
});

const BudgetAllocationChart = dynamic(() => import("./components/DashboardCharts").then((mod) => mod.BudgetAllocationChart), {
  loading: () => <ChartSkeleton title="Budget Allocation" />,
  ssr: false,
});

const categoryColors = {
  essentials: "#5f8f63",
  debt: "#b36a3c",
  savings: "#2f7d46",
  lifestyle: "#b59b64",
};

const categoryLabels = {
  essentials: "Essential Expenses",
  debt: "Debt & Obligations",
  savings: "Financial Goals",
  lifestyle: "Lifestyle / Discretionary",
};

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
  const [activeDashboardTab, setActiveDashboardTab] = useState("budget");
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
    setActiveDashboardTab("budget");
  }, []);

  const switchDashboardTab = useCallback((tab) => {
    startTabTransition(() => setActiveDashboardTab(tab));
  }, []);

  const showDashboardTabs = Boolean(session.user?.emailVerified && session.user?.onboardingComplete && summary);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-mark">
              <Sparkles size={18} />
            </div>
            <span>Finova</span>
          </div>
          {showDashboardTabs && (
            <nav className="dashboard-tabs" aria-label="Dashboard sections">
              <button className={`dashboard-tab ${activeDashboardTab === "budget" ? "active" : ""}`} onClick={() => switchDashboardTab("budget")}>
                <BarChart3 size={16} />
                Budget & Expense
              </button>
              <button className={`dashboard-tab ${activeDashboardTab === "insights" ? "active" : ""}`} onClick={() => switchDashboardTab("insights")}>
                <Sparkles size={16} />
                Insights & Habits
              </button>
              <button className={`dashboard-tab ${activeDashboardTab === "settings" ? "active" : ""}`} onClick={() => switchDashboardTab("settings")}>
                <Settings size={16} />
                Settings
              </button>
            </nav>
          )}
        </div>
        <div className="top-actions">
          {summary && (
            <button className="btn secondary icon" title="Refresh dashboard" onClick={refresh}>
              <RefreshCcw size={17} />
            </button>
          )}
          {session.user && (
            <button className="btn secondary" onClick={logout}>
              <LogOut size={17} />
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="container">
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
          <Dashboard user={session.user} summary={summary} activeTab={activeDashboardTab} isTabPending={isTabPending} onDone={refresh} />
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
        }),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel section">
      <h2>Profile And Budget Setup</h2>
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
        {error && <div className="alert risk">{error}</div>}
        <button className="btn" type="submit">
          <PiggyBank size={17} />
          Generate assistant budget
        </button>
      </form>
    </section>
  );
}

const Dashboard = memo(function Dashboard({ user, summary, activeTab, isTabPending, onDone }) {
  if (!summary) return null;
  const { profile, income, categories, ranking, recommendations, health, alerts, metals, streak, habits, transactions, debtObligations, emiReminders } = summary;
  const chartData = useMemo(() => categories.map((category) => ({
    name: category.label.replace(" / ", " "),
    Actual: category.spent,
    Expected: category.expected,
    Limit: category.monthlyLimit,
    type: category.type,
  })), [categories]);
  const pieData = useMemo(() => categories.map((category) => ({ name: category.label, value: category.monthlyLimit, type: category.type })), [categories]);

  return (
    <div className="dashboard">
      <section className="summary-grid">
        <div className="panel metric health-metric">
          <div className="score-wrap">
            <div className="score-ring-luxury" style={{ "--score": `${health.score}%` }} role="img" aria-label={`Financial health score ${health.score} out of 100`}>
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
            {alerts.map((alert) => (
              <div key={alert.message} className={`alert ${alert.level}`}>
                <AlertTriangle size={18} />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={`tab-panel ${isTabPending ? "pending" : ""}`}>
        {activeTab === "settings" ? (
          <SettingsPage user={user} profile={profile} income={income} onDone={onDone} />
        ) : activeTab === "budget" ? (
          <BudgetManagementPage categories={categories} chartData={chartData} pieData={pieData} ranking={ranking} onDone={onDone} />
        ) : (
          <InsightsHabitsPage recommendations={recommendations} habits={habits} metals={metals} transactions={transactions || []} categories={categories} debtObligations={debtObligations || []} emiReminders={emiReminders || []} onDone={onDone} />
        )}
      </div>
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

const EditableTransaction = memo(function EditableTransaction({ transaction, onDone }) {
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
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
            <strong>{categoryLabels[transaction.categoryType]}</strong>
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
          <span style={{ width: `${category.progress}%`, background: categoryColors[category.type] }} />
        </div>
        <div className="money-row">
          <span>{isDebt ? "Target" : "Limit"} {formatMoney(category.monthlyLimit)}</span>
          <span>{isDebt ? "Repaid" : "Spent"} {formatMoney(category.spent)}</span>
          <span>Expected {formatMoney(category.expected)}</span>
          <span>{isDebt ? "Due left" : "Remaining"} {formatMoney(category.remaining)}</span>
        </div>
      </div>
      <CircleDollarSign color={categoryColors[category.type]} />
    </div>
  );
});

function StatusBadge({ status }) {
  const icon = status === "green" ? <Check size={13} /> : <AlertTriangle size={13} />;
  const label = status === "green" ? "On track" : status === "orange" ? "Warning" : "Over limit";
  return <span className={`badge status ${status}`}>{icon}{label}</span>;
}

const TransactionForm = memo(function TransactionForm({ onDone }) {
  const [form, setForm] = useState({ categoryType: "essentials", amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");

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
            <option value="essentials">Essential Expenses</option>
            <option value="debt">Debt & Obligations</option>
            <option value="savings">Financial Goals</option>
            <option value="lifestyle">Lifestyle / Discretionary</option>
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
