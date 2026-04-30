import { z } from "zod";
import { getCurrentUser, requireVerified } from "@/lib/auth";
import { id, nowIso, readDb, updateDb } from "@/lib/store";

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
  const db = await readDb();
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const transactions = db.transactions.filter((transaction) => {
    if (transaction.userId !== current.id) return false;
    return date ? transaction.date === date : true;
  });
  return Response.json({ transactions });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a category and enter a positive amount." }, { status: 400 });

  const transaction = await updateDb(async (db) => {
    const created = {
      id: id("txn"),
      userId: current.id,
      categoryType: parsed.data.categoryType,
      amount: parsed.data.amount,
      note: parsed.data.note || "",
      date: parsed.data.date || nowIso().slice(0, 10),
      createdAt: nowIso(),
    };
    db.transactions.push(created);
    return created;
  });

  return Response.json({ transaction });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a saved activity and enter a positive amount." }, { status: 400 });

  const transaction = await updateDb(async (db) => {
    const found = db.transactions.find((candidate) => candidate.id === parsed.data.id && candidate.userId === current.id);
    if (!found) return null;
    if (parsed.data.categoryType) found.categoryType = parsed.data.categoryType;
    found.amount = parsed.data.amount;
    found.note = parsed.data.note || "";
    found.updatedAt = nowIso();
    return found;
  });

  if (!transaction) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json({ transaction });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose an activity to delete." }, { status: 400 });

  const deleted = await updateDb(async (db) => {
    const before = db.transactions.length;
    db.transactions = db.transactions.filter((candidate) => !(candidate.id === parsed.data.id && candidate.userId === current.id));
    return db.transactions.length < before;
  });

  if (!deleted) return Response.json({ error: "Activity not found." }, { status: 404 });
  return Response.json({ ok: true });
}
