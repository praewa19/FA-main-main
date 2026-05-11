import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { categoryMeta } from "@/lib/budget";
import { fromCategory, toCategory, toIncome, toProfile } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

const categorySchema = z.object({
  id: z.string().optional(),
  type: z.string().min(2).max(48),
  label: z.string().min(2).max(80),
  percentage: z.coerce.number().min(0).max(100),
  priority: z.string().min(2).max(24).optional(),
});

const schema = z.object({
  incomePeriod: z.enum(["monthly", "annual"]).optional(),
  incomeAmount: z.coerce.number().positive().optional(),
  categories: z.array(categorySchema).min(1).optional(),
  changedType: z.string().min(2).max(48).optional(),
});

function monthlyIncome(period, amount) {
  return Math.round(period === "annual" ? amount / 12 : amount);
}

function ensureSavingsCategory(categories) {
  if (categories.some((category) => category.type === "savings")) return categories;
  return [
    ...categories,
    {
      type: "savings",
      label: categoryMeta.savings.label,
      priority: categoryMeta.savings.priority,
      percentage: 0,
    },
  ];
}

function normalizeAroundChanged(categories, changedType) {
  const total = categories.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
  if (Math.round(total) === 100 || !changedType) return categories;
  const changed = categories.find((category) => category.type === changedType);
  const others = categories.filter((category) => category.type !== changedType);
  if (!changed || !others.length) return categories;

  const remaining = Math.max(0, 100 - changed.percentage);
  const othersTotal = others.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
  if (othersTotal <= 0) {
    const equal = remaining / others.length;
    return categories.map((category) => category.type === changedType ? category : { ...category, percentage: equal });
  }
  return categories.map((category) => (
    category.type === changedType
      ? category
      : { ...category, percentage: (Number(category.percentage || 0) / othersTotal) * remaining }
  ));
}

function assignRemainderToSavings(categories) {
  const withSavings = ensureSavingsCategory(categories);
  const total = withSavings.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
  if (total > 100) return withSavings;
  const remainder = 100 - total;
  if (remainder <= 0) return withSavings;
  return withSavings.map((category) => (
    category.type === "savings"
      ? { ...category, percentage: Number(category.percentage || 0) + remainder }
      : category
  ));
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid budget details." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const [
    { data: incomeRow, error: incomeError },
    { data: profileRow, error: profileError },
  ] = await Promise.all([
    supabase.from("incomes").select("*").eq("user_id", current.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", current.id).maybeSingle(),
  ]);
  if (incomeError || profileError) return Response.json({ error: (incomeError || profileError).message }, { status: 400 });

  const currentIncome = toIncome(incomeRow);
  const profile = toProfile(profileRow);
  if (!currentIncome || !profile) return Response.json({ error: "Complete onboarding before editing budget." }, { status: 428 });

  const nextPeriod = parsed.data.incomePeriod || currentIncome.period;
  const nextAmount = parsed.data.incomeAmount || currentIncome.amount;
  const nextMonthlyIncome = monthlyIncome(nextPeriod, nextAmount);

  const { error: updateIncomeError } = await supabase.from("incomes").upsert({
    id: currentIncome.id || id("income"),
    user_id: current.id,
    period: nextPeriod,
    amount: nextAmount,
    monthly_income: nextMonthlyIncome,
    updated_at: nowIso(),
  }, { onConflict: "user_id" });
  if (updateIncomeError) return Response.json({ error: updateIncomeError.message }, { status: 400 });

  if (parsed.data.categories) {
    const normalized = assignRemainderToSavings(normalizeAroundChanged(parsed.data.categories, parsed.data.changedType));
    const total = normalized.reduce((sum, category) => sum + Number(category.percentage || 0), 0);
    if (Math.round(total) !== 100) {
      return Response.json({ error: `Total allocation must equal 100%. Current total is ${total.toFixed(1)}%.` }, { status: 400 });
    }

    const { data: planRow, error: planError } = await supabase.from("budget_plans").select("*").eq("user_id", current.id).maybeSingle();
    if (planError) return Response.json({ error: planError.message }, { status: 400 });
    const planId = planRow?.id || id("plan");
    const percentages = Object.fromEntries(normalized.map((category) => [category.type, Number((category.percentage / 100).toFixed(4))]));

    const { error: upsertPlanError } = await supabase.from("budget_plans").upsert({
      id: planId,
      user_id: current.id,
      monthly_income: nextMonthlyIncome,
      has_debt: profile.hasDebt,
      percentages,
      created_at: planRow?.created_at || nowIso(),
    }, { onConflict: "user_id" });
    if (upsertPlanError) return Response.json({ error: upsertPlanError.message }, { status: 400 });

    const { data: currentRows, error: currentCategoryError } = await supabase.from("categories").select("*").eq("user_id", current.id);
    if (currentCategoryError) return Response.json({ error: currentCategoryError.message }, { status: 400 });
    const existingRows = currentRows || [];
    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const existingByType = new Map(existingRows.map((row) => [row.type, row]));
    const rows = normalized.map((category) => {
      const existing = (category.id && existingById.get(category.id)) || existingByType.get(category.type);
      return fromCategory({
        id: existing?.id || category.id || id("cat"),
        userId: current.id,
        planId,
        type: category.type,
        label: category.label,
        priority: category.priority || categoryMeta[category.type]?.priority || "Medium",
        weight: categoryMeta[category.type]?.weight || 1,
        monthlyLimit: Math.round(nextMonthlyIncome * (category.percentage / 100)),
        createdAt: existing?.created_at || nowIso(),
      });
    });
    const retainedIds = new Set(rows.map((row) => row.id));
    const deleteIds = existingRows.filter((row) => !retainedIds.has(row.id)).map((row) => row.id);
    if (deleteIds.length) {
      const { error: deleteError } = await supabase.from("categories").delete().in("id", deleteIds).eq("user_id", current.id);
      if (deleteError) return Response.json({ error: deleteError.message }, { status: 400 });
    }

    const { data, error } = await supabase.from("categories").upsert(rows, { onConflict: "id" }).select("*");
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ categories: (data || []).map(toCategory) });
  }

  return Response.json({ ok: true });
}
