import { createSupabaseServerClient, supabaseConfigError } from "@/lib/auth";

export async function POST() {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
