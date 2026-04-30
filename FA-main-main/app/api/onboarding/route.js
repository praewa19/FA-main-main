import { z } from "zod";
import { getCurrentUser, requireVerified } from "@/lib/auth";
import { buildBudgetPlan } from "@/lib/budget";
import { id, nowIso, publicUser, updateDb } from "@/lib/store";

const schema = z.object({
  name: z.string().min(2),
  birthdate: z.string().min(8),
  incomePeriod: z.enum(["monthly", "annual"]),
  incomeAmount: z.coerce.number().positive(),
  priority: z.enum(["saving", "debt", "lifestyle"]),
  mode: z.enum(["student", "professional", "family"]),
  hasDebt: z.boolean(),
});

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Complete all onboarding fields." }, { status: 400 });

  const monthlyIncome = Math.round(parsed.data.incomePeriod === "annual" ? parsed.data.incomeAmount / 12 : parsed.data.incomeAmount);
  const generated = buildBudgetPlan({
    userId: current.id,
    monthlyIncome,
    hasDebt: parsed.data.hasDebt,
    priority: parsed.data.priority,
    mode: parsed.data.mode,
  });

  const user = await updateDb(async (db) => {
    db.profiles = db.profiles.filter((profile) => profile.userId !== current.id);
    db.incomes = db.incomes.filter((income) => income.userId !== current.id);
    db.budgetPlans = db.budgetPlans.filter((plan) => plan.userId !== current.id);
    db.categories = db.categories.filter((category) => category.userId !== current.id);

    db.profiles.push({
      id: id("profile"),
      userId: current.id,
      name: parsed.data.name,
      birthdate: parsed.data.birthdate,
      priority: parsed.data.priority,
      mode: parsed.data.mode,
      hasDebt: parsed.data.hasDebt,
      updatedAt: nowIso(),
    });
    db.incomes.push({
      id: id("income"),
      userId: current.id,
      period: parsed.data.incomePeriod,
      amount: parsed.data.incomeAmount,
      monthlyIncome,
      updatedAt: nowIso(),
    });
    db.budgetPlans.push(generated.plan);
    db.categories.push(...generated.categories);
    const found = db.users.find((candidate) => candidate.id === current.id);
    found.onboardingComplete = true;
    return found;
  });

  return Response.json({ user: publicUser(user) });
}
