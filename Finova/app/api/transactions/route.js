import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fetchAllRows, fromTransaction, toTransaction } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

const GOAL_CATEGORY_PREFIX = "goal:";

const schema = z.object({
  categoryType: z.string().min(2).max(48),
  goalId: z.string().min(1).max(120).optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  note: z.string().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  categoryType: z.string().min(2).max(48).optional(),
  goalId: z.string().min(1).max(120).optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  note: z.string().max(120).optional(),
});

function isGoalCategoryType(categoryType = "") {
  return categoryType.startsWith(GOAL_CATEGORY_PREFIX);
}

function goalCategoryType(goalId) {
  return `${GOAL_CATEGORY_PREFIX}${goalId}`;
}

async function getGoalById(supabase, userId, goalId) {
  if (!goalId) return null;
  const { data, error } = await supabase
    .from("goals")
    .select("id, name, current")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function resolveGoalSelection({ supabase, userId, categoryType, goalId, note }) {
  const inferredGoalId = goalId || (isGoalCategoryType(categoryType) ? categoryType.slice(GOAL_CATEGORY_PREFIX.length) : "");
  if (!inferredGoalId) {
    return {
      categoryType,
      goalId: null,
      note: note || "",
    };
  }

  const goal = await getGoalById(supabase, userId, inferredGoalId);
  if (!goal) {
    throw new Error("Selected goal was not found.");
  }

  return {
    categoryType: goalCategoryType(goal.id),
    goalId: goal.id,
    note: note?.trim() || `saved towards ${goal.name}`,
  };
}

async function applyGoalAdjustments(supabase, userId, adjustments) {
  for (const [goalId, delta] of adjustments.entries()) {
    if (!goalId || !delta) continue;
    const goal = await getGoalById(supabase, userId, goalId);
    if (!goal) continue;
    const nextCurrent = Math.max(0, Number(goal.current || 0) + Number(delta || 0));
    const { error } = await supabase
      .from("goals")
      .update({ current: nextCurrent, updated_at: nowIso() })
      .eq("id", goalId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

function buildAdjustments(previousTransaction, nextTransaction) {
  const adjustments = new Map();
  if (previousTransaction?.goalId) {
    adjustments.set(
      previousTransaction.goalId,
      (adjustments.get(previousTransaction.goalId) || 0) - Number(previousTransaction.amount || 0),
    );
  }
  if (nextTransaction?.goalId) {
    adjustments.set(
      nextTransaction.goalId,
      (adjustments.get(nextTransaction.goalId) || 0) + Number(nextTransaction.amount || 0),
    );
  }
  return adjustments;
}

export async function GET(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  try {
    const rows = await fetchAllRows(() => {
      let query = supabase.from("transactions").select("*").eq("user_id", current.id);
      if (date) query = query.eq("date", date);
      return query
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
    });

    return Response.json({ transactions: rows.map(toTransaction) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a category and enter a positive amount." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  let resolved;
  try {
    resolved = await resolveGoalSelection({
      supabase,
      userId: current.id,
      categoryType: parsed.data.categoryType,
      goalId: parsed.data.goalId,
      note: parsed.data.note,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  const created = {
    id: id("txn"),
    userId: current.id,
    categoryType: resolved.categoryType,
    goalId: resolved.goalId,
    amount: parsed.data.amount,
    note: resolved.note,
    date: parsed.data.date || nowIso().slice(0, 10),
    createdAt: nowIso(),
  };
  const { data, error } = await supabase.from("transactions").insert(fromTransaction(created)).select("*").single();
  if (error) {
    const isCategoryConstraint = error.message?.includes("transactions_category_type_check");
    return Response.json({
      error: isCategoryConstraint
        ? "Your database still has the old transaction category constraint. Run the latest Supabase migration so credit and custom categories can be saved."
        : error.message,
    }, { status: 400 });
  }

  try {
    await applyGoalAdjustments(supabase, current.id, buildAdjustments(null, created));
  } catch (goalError) {
    return Response.json({ error: goalError.message }, { status: 400 });
  }

  return Response.json({ transaction: toTransaction(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a saved activity and enter a positive amount." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .maybeSingle();
  if (existingError) return Response.json({ error: existingError.message }, { status: 400 });
  if (!existing) return Response.json({ error: "Activity not found." }, { status: 404 });

  let resolved;
  try {
    resolved = await resolveGoalSelection({
      supabase,
      userId: current.id,
      categoryType: parsed.data.categoryType || existing.category_type,
      goalId: parsed.data.goalId,
      note: parsed.data.note,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const updates = {
    amount: parsed.data.amount,
    note: resolved.note,
    goal_id: resolved.goalId,
    updated_at: nowIso(),
  };
  if (parsed.data.categoryType || parsed.data.goalId !== undefined) updates.category_type = resolved.categoryType;
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const isCategoryConstraint = error.message?.includes("transactions_category_type_check");
    return Response.json({
      error: isCategoryConstraint
        ? "Your database still has the old transaction category constraint. Run the latest Supabase migration so credit and custom categories can be saved."
        : error.message,
    }, { status: 400 });
  }
  if (!data) return Response.json({ error: "Activity not found." }, { status: 404 });

  try {
    await applyGoalAdjustments(
      supabase,
      current.id,
      buildAdjustments(toTransaction(existing), {
        ...toTransaction(data),
        amount: parsed.data.amount,
        categoryType: resolved.categoryType,
        goalId: resolved.goalId,
        note: resolved.note,
      }),
    );
  } catch (goalError) {
    return Response.json({ error: goalError.message }, { status: 400 });
  }
  return Response.json({ transaction: toTransaction(data) });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose an activity to delete." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .maybeSingle();
  if (existingError) return Response.json({ error: existingError.message }, { status: 400 });
  if (!existing) return Response.json({ error: "Activity not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("id")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Activity not found." }, { status: 404 });

  try {
    await applyGoalAdjustments(supabase, current.id, buildAdjustments(toTransaction(existing), null));
  } catch (goalError) {
    return Response.json({ error: goalError.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}
