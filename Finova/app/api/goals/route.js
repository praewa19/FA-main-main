import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromGoal, toGoal } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

function isMissingTable(error) {
  return ["42P01", "PGRST205"].includes(error?.code) || error?.message?.toLowerCase().includes("could not find the table");
}

const goalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  emoji: z.string().min(1).max(8),
  target: z.coerce.number().positive(),
  current: z.coerce.number().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", current.id).order("created_at", { ascending: true });
  if (isMissingTable(error)) return Response.json({ goals: [], schemaMissing: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ goals: (data || []).map(toGoal) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = goalSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter a goal, emoji, target, and deadline." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const goal = fromGoal({ ...parsed.data, id: id("goal"), userId: current.id, createdAt: nowIso(), updatedAt: nowIso() });
  const { data, error } = await supabase.from("goals").insert(goal).select("*").single();
  if (isMissingTable(error)) return Response.json({ error: "Goals storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ goal: toGoal(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = goalSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid goal details." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("goals")
    .update({
      name: parsed.data.name,
      emoji: parsed.data.emoji,
      target: parsed.data.target,
      current: parsed.data.current,
      deadline: parsed.data.deadline,
      priority: parsed.data.priority,
      updated_at: nowIso(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();
  if (isMissingTable(error)) return Response.json({ error: "Goals storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Goal not found." }, { status: 404 });
  return Response.json({ goal: toGoal(data) });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a goal to delete." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error: unlinkError } = await supabase
    .from("transactions")
    .update({
      goal_id: null,
      category_type: "savings",
      updated_at: nowIso(),
    })
    .eq("user_id", current.id)
    .eq("goal_id", parsed.data.id);
  if (unlinkError && !isMissingTable(unlinkError)) return Response.json({ error: unlinkError.message }, { status: 400 });
  const { error } = await supabase.from("goals").delete().eq("id", parsed.data.id).eq("user_id", current.id);
  if (isMissingTable(error)) return Response.json({ error: "Goals storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
