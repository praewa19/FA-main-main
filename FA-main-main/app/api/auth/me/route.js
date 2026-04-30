import { getCurrentUser, getLocalSessionData, supabaseConfigError } from "@/lib/auth";
import { publicUser } from "@/lib/store";

export async function GET() {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  const { profile, income } = await getLocalSessionData(user);
  return Response.json({
    user: publicUser(user),
    profile,
    income,
  });
}
