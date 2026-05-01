import { getSessionData } from "@/lib/data";
import { createSupabaseAdminClient, createSupabaseServerClient, supabaseConfigError } from "@/lib/supabase-server";
import { nowIso, publicUser } from "@/lib/store";

export function normalizeSupabaseUser(user, localUser = null) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_confirmed_at || user.confirmed_at),
    onboardingComplete: Boolean(localUser?.onboardingComplete),
    createdAt: user.created_at || localUser?.createdAt || nowIso(),
  };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { profile, income } = await getSessionData(data.user.id);
  return normalizeSupabaseUser(data.user, { onboardingComplete: Boolean(profile && income) });
}

export async function getPublicUserFromAuthResponse(supabaseUser) {
  if (!supabaseUser) return null;
  const { profile, income } = await getSessionData(supabaseUser.id);
  return publicUser(normalizeSupabaseUser(supabaseUser, { onboardingComplete: Boolean(profile && income) }));
}

export async function getLocalSessionData(user) {
  if (!user) return { profile: null, income: null };
  return getSessionData(user.id);
}

export function requireVerified(user) {
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!user.emailVerified) return Response.json({ error: "Email verification required" }, { status: 403 });
  return null;
}

export { createSupabaseAdminClient, createSupabaseServerClient, supabaseConfigError };
