import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromHabit, toHabit } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

const schema = z.object({
  budgetAdherence: z.boolean(),
  spendingControl: z.boolean(),
  savingsAction: z.boolean(),
});

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("habits").select("*").eq("user_id", current.id).order("date", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ habits: (data || []).map(toHabit) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid habit log." }, { status: 400 });

  const today = nowIso().slice(0, 10);
  const supabase = await createSupabaseServerClient();
  const created = {
    id: id("habit"),
    userId: current.id,
    date: today,
    ...parsed.data,
    createdAt: nowIso(),
  };
  const { data, error } = await supabase
    .from("habits")
    .upsert(fromHabit(created), { onConflict: "user_id,date" })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ habit: toHabit(data) });
}
