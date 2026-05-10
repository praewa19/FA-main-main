import { createBrowserRouter } from "react-router";
import { OnboardingLayout } from "./layouts/OnboardingLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { EmailVerificationPage } from "./pages/auth/EmailVerificationPage";
import { ProfileSetupPage } from "./pages/onboarding/ProfileSetupPage";
import { IncomeSetupPage } from "./pages/onboarding/IncomeSetupPage";
import { PrioritySetupPage } from "./pages/onboarding/PrioritySetupPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { BudgetPage } from "./pages/dashboard/BudgetPage";
import { TransactionsPage } from "./pages/dashboard/TransactionsPage";
import { GoalsPage } from "./pages/dashboard/GoalsPage";
import { HabitsPage } from "./pages/dashboard/HabitsPage";
import { AnalyticsPage } from "./pages/dashboard/AnalyticsPage";
import { InvestmentsPage } from "./pages/dashboard/InvestmentsPage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import { FinovaLandingPage } from "./pages/FinovaLandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: FinovaLandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/verify-email",
    Component: EmailVerificationPage,
  },
  {
    path: "/onboarding",
    Component: OnboardingLayout,
    children: [
      { path: "profile", Component: ProfileSetupPage },
      { path: "income", Component: IncomeSetupPage },
      { path: "priorities", Component: PrioritySetupPage },
    ],
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "budget", Component: BudgetPage },
      { path: "transactions", Component: TransactionsPage },
      { path: "goals", Component: GoalsPage },
      { path: "habits", Component: HabitsPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "investments", Component: InvestmentsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
