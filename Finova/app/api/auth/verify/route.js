import { getCurrentUser } from "@/lib/auth";
import { publicUser } from "@/lib/store";

export async function POST() {
  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "Not authenticated" }, { status: 401 });

  if (!current.emailVerified) {
    return Response.json({ error: "Confirm your email from the Supabase verification link, then log in." }, { status: 403 });
  }

  return Response.json({ user: publicUser(current) });
}
