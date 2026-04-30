import { redirect } from "next/navigation";
import { createSupabaseServerClient, supabaseConfigError } from "@/lib/auth";

export async function GET(request) {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect(next.startsWith("/") ? next : "/");
}
