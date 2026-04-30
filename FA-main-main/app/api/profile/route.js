import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { nowIso, updateDb } from "@/lib/store";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: passwordSchema.optional().or(z.literal("")),
});

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Enter valid profile details." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  if (!name && !email && !password) {
    return Response.json({ error: "Change at least one profile setting." }, { status: 400 });
  }

  if (name) {
    await updateDb(async (db) => {
      const profile = db.profiles.find((candidate) => candidate.userId === current.id);
      if (profile) {
        profile.name = name;
        profile.updatedAt = nowIso();
      }
    });
  }

  if (email || password) {
    const supabase = await createSupabaseServerClient();
    const updates = {};
    if (email) updates.email = email.toLowerCase();
    if (password) updates.password = password;
    const { error } = await supabase.auth.updateUser(updates);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({
    message: email
      ? "Profile updated. Confirm the email change from your inbox if Supabase requires it."
      : "Profile updated.",
  });
}
