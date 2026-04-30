import { z } from "zod";
import { getCurrentUser, requireVerified } from "@/lib/auth";
import { id, nowIso, readDb, updateDb } from "@/lib/store";

const schema = z.object({
  budgetAdherence: z.boolean(),
  spendingControl: z.boolean(),
  savingsAction: z.boolean(),
});

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const db = await readDb();
  return Response.json({ habits: db.habits.filter((habit) => habit.userId === current.id) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid habit log." }, { status: 400 });

  const today = nowIso().slice(0, 10);
  const habit = await updateDb(async (db) => {
    db.habits = db.habits.filter((candidate) => !(candidate.userId === current.id && candidate.date === today));
    const created = {
      id: id("habit"),
      userId: current.id,
      date: today,
      ...parsed.data,
      createdAt: nowIso(),
    };
    db.habits.push(created);
    return created;
  });

  return Response.json({ habit });
}
