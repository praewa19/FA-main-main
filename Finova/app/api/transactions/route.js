import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromTransaction, toTransaction } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

const schema = z.object({
  categoryType: z.enum(["essentials", "debt", "savings", "lifestyle"]),
  amount: z.coerce.number().positive(),
  note: z.string().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  categoryType: z.enum(["essentials", "debt", "savings", "lifestyle"]).optional(),
  amount: z.coerce.number().positive(),
  note: z.string().max(120).optional(),
});

export async function GET(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  let query = supabase.from("transactions").select("*").eq("user_id", current.id);
  if (date) query = query.eq("date", date);
  const { data, error } = await query.order("date", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ transactions: (data || []).map(toTransaction) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a category and enter a positive amount." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const created = {
    id: id("txn"),
    userId: current.id,
    categoryType: parsed.data.categoryType,
    amount: parsed.data.amount,
    note: parsed.data.note || "",
    date: parsed.data.date || nowIso().slice(0, 10),
    createdAt: nowIso(),
  };
  const { data, error } = await supabase.from("transactions").insert(fromTransaction(created)).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ transaction: toTransaction(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a saved activity and enter a positive amount." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const updates = {
    amount: parsed.data.amount,
    note: parsed.data.note || "",
    updated_at: nowIso(),
  };
  if (parsed.data.categoryType) updates.category_type = parsed.data.categoryType;
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json({ transaction: toTransaction(data) });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose an activity to delete." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("id")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json({ ok: true });
}
