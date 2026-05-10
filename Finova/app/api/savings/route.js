import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromSavingsTarget, toSavingsTarget } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

function isMissingTable(error) {
  return ["42P01", "PGRST205"].includes(error?.code) || error?.message?.toLowerCase().includes("could not find the table");
}

const savingsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  target: z.coerce.number().positive(),
  current: z.coerce.number().min(0).default(0),
  monthlyContribution: z.coerce.number().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("savings_targets").select("*").eq("user_id", current.id).order("created_at", { ascending: true });
  if (isMissingTable(error)) return Response.json({ savingsTargets: [], schemaMissing: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ savingsTargets: (data || []).map(toSavingsTarget) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = savingsSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter a savings target and amount." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const target = fromSavingsTarget({
    ...parsed.data,
    id: id("sav"),
    userId: current.id,
    deadline: parsed.data.deadline || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  const { data, error } = await supabase.from("savings_targets").insert(target).select("*").single();
  if (isMissingTable(error)) return Response.json({ error: "Savings storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ savingsTarget: toSavingsTarget(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = savingsSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid savings details." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("savings_targets")
    .update({
      name: parsed.data.name,
      target: parsed.data.target,
      current: parsed.data.current,
      monthly_contribution: parsed.data.monthlyContribution,
      deadline: parsed.data.deadline || null,
      updated_at: nowIso(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();
  if (isMissingTable(error)) return Response.json({ error: "Savings storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Savings target not found." }, { status: 404 });
  return Response.json({ savingsTarget: toSavingsTarget(data) });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a savings target to delete." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("savings_targets").delete().eq("id", parsed.data.id).eq("user_id", current.id);
  if (isMissingTable(error)) return Response.json({ error: "Savings storage is not ready. Run Finova/supabase/schema.sql in Supabase, then refresh the schema cache." }, { status: 503 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
