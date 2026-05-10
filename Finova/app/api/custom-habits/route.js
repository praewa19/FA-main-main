import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromCustomHabit, toCustomHabit } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

function isMissingTable(error) {
  return ["42P01", "PGRST205"].includes(error?.code) || error?.message?.toLowerCase().includes("could not find the table");
}

const habitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(160).optional().default(""),
  icon: z.string().min(1).max(8).default("*"),
  targetDays: z.coerce.number().int().min(1).max(365).default(30),
  completedToday: z.boolean().default(false),
  streak: z.coerce.number().int().min(0).default(0),
  bestStreak: z.coerce.number().int().min(0).default(0),
});

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = habitSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid habit details." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const created = fromCustomHabit({ ...parsed.data, id: id("habitcfg"), userId: current.id, createdAt: nowIso(), updatedAt: nowIso() });
  const { data, error } = await supabase.from("custom_habits").insert(created).select("*").single();
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
  const nextStreak = parsed.data.completedToday ? Math.max(1, parsed.data.streak) : parsed.data.streak;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("custom_habits")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      target_days: parsed.data.targetDays,
      completed_today: parsed.data.completedToday,
      streak: nextStreak,
      best_streak: Math.max(parsed.data.bestStreak, nextStreak),
      updated_at: nowIso(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();
  if (isMissingTable(error)) return Response.json({ error: "Habit storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Habit not found." }, { status: 404 });
  return Response.json({ habit: toCustomHabit(data) });
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
