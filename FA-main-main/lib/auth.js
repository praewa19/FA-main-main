import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { nowIso, publicUser, readDb, updateDb } from "@/lib/store";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { url, anonKey };
}

export function supabaseConfigError() {
  try {
    supabaseConfig();
    return null;
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = supabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

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

export async function ensureLocalUser(supabaseUser) {
  if (!supabaseUser) return null;

  return updateDb(async (db) => {
    let user = db.users.find((candidate) => candidate.id === supabaseUser.id);
    if (!user) {
      user = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        emailVerified: Boolean(supabaseUser.email_confirmed_at || supabaseUser.confirmed_at),
        onboardingComplete: false,
        createdAt: supabaseUser.created_at || nowIso(),
      };
      db.users.push(user);
    } else {
      user.email = supabaseUser.email;
      user.emailVerified = Boolean(supabaseUser.email_confirmed_at || supabaseUser.confirmed_at);
    }

    return user;
  });
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const localUser = await ensureLocalUser(data.user);
  return normalizeSupabaseUser(data.user, localUser);
}

export async function getPublicUserFromAuthResponse(supabaseUser) {
  const localUser = await ensureLocalUser(supabaseUser);
  return publicUser(normalizeSupabaseUser(supabaseUser, localUser));
}

export async function getLocalSessionData(user) {
  if (!user) return { profile: null, income: null };
  const db = await readDb();
  return {
    profile: db.profiles.find((profile) => profile.userId === user.id) || null,
    income: db.incomes.find((income) => income.userId === user.id) || null,
  };
}

export function requireVerified(user) {
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!user.emailVerified) return Response.json({ error: "Email verification required" }, { status: 403 });
  return null;
}
