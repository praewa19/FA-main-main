import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromCustomHabit, fromHabitLog, toCustomHabit, toHabitLog } from "@/lib/data";
import { computeHabitMetrics, indiaDateKey } from "@/lib/habits";
import { id, nowIso } from "@/lib/store";

function isMissingTable(error) {
  return ["42P01", "PGRST205"].includes(error?.code) || error?.message?.toLowerCase().includes("could not find the table");
}

function isMissingCadenceColumn(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("cadence") && (message.includes("schema cache") || message.includes("column"));
}

function withoutCadence(payload) {
  const { cadence, ...rest } = payload;
  return rest;
}

const habitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(160).optional().default(""),
  icon: z.string().min(1).max(8).default("*"),
  cadence: z.enum(["daily", "weekly"]).default("daily"),
  targetDays: z.coerce.number().int().min(1).max(365).default(30),
  completedToday: z.boolean().default(false),
  streak: z.coerce.number().int().min(0).default(0),
  bestStreak: z.coerce.number().int().min(0).default(0),
});

async function loadHabitLogs(supabase, userId, habitId) {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .order("log_date", { ascending: true });
  if (isMissingTable(error)) return [];
  if (error) throw error;
  return (data || []).map(toHabitLog);
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = habitSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid habit details." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const created = fromCustomHabit({ ...parsed.data, id: id("habitcfg"), userId: current.id, createdAt: nowIso(), updatedAt: nowIso() });
  let { data, error } = await supabase.from("custom_habits").insert(created).select("*").single();
  if (isMissingCadenceColumn(error)) {
    ({ data, error } = await supabase.from("custom_habits").insert(withoutCadence(created)).select("*").single());
  }
  if (isMissingTable(error)) return Response.json({ error: "Habit storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ habit: toCustomHabit(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = habitSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid habit details." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const baseUpdate = {
    name: parsed.data.name,
    description: parsed.data.description,
    icon: parsed.data.icon,
    cadence: parsed.data.cadence,
    target_days: parsed.data.targetDays,
    updated_at: nowIso(),
  };
  let { data, error } = await supabase
    .from("custom_habits")
    .update(baseUpdate)
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();
  if (isMissingCadenceColumn(error)) {
    ({ data, error } = await supabase
      .from("custom_habits")
      .update(withoutCadence(baseUpdate))
      .eq("id", parsed.data.id)
      .eq("user_id", current.id)
      .select("*")
      .maybeSingle());
  }
  if (isMissingTable(error)) return Response.json({ error: "Habit storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Habit not found." }, { status: 404 });

  const today = indiaDateKey();
  try {
    if (parsed.data.completedToday) {
      const log = fromHabitLog({
        id: id("habitlog"),
        userId: current.id,
        habitId: parsed.data.id,
        logDate: today,
        completed: true,
        createdAt: nowIso(),
      });
      const { error: logError } = await supabase.from("habit_logs").upsert(log, { onConflict: "user_id,habit_id,log_date" });
      if (logError && !isMissingTable(logError)) return Response.json({ error: logError.message }, { status: 400 });
    } else {
      const { error: deleteLogError } = await supabase.from("habit_logs").delete().eq("user_id", current.id).eq("habit_id", parsed.data.id).eq("log_date", today);
      if (deleteLogError && !isMissingTable(deleteLogError)) return Response.json({ error: deleteLogError.message }, { status: 400 });
    }
    const logs = await loadHabitLogs(supabase, current.id, parsed.data.id);
    const metrics = computeHabitMetrics(toCustomHabit(data), logs);
    const { data: finalRow, error: finalError } = await supabase
      .from("custom_habits")
      .update({
        completed_today: metrics.completedToday,
        streak: metrics.streak,
        best_streak: metrics.bestStreak,
        updated_at: nowIso(),
      })
      .eq("id", parsed.data.id)
      .eq("user_id", current.id)
      .select("*")
      .maybeSingle();
    if (finalError) return Response.json({ error: finalError.message }, { status: 400 });
    return Response.json({ habit: { ...toCustomHabit(finalRow), logs } });
  } catch (logError) {
    return Response.json({ error: logError.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a habit to delete." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("custom_habits").delete().eq("id", parsed.data.id).eq("user_id", current.id);
  if (isMissingTable(error)) return Response.json({ error: "Habit storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
