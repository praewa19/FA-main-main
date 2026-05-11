import { createSupabaseServerClient, supabaseConfigError } from "@/lib/auth";
import { invalidateCachedMarketSnapshot } from "@/lib/market-session-cache";

export async function POST() {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  invalidateCachedMarketSnapshot(user?.id);
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
