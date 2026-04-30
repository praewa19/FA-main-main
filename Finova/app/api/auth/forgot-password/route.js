import { z } from "zod";
import { createSupabaseServerClient, supabaseConfigError } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request) {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email.toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return Response.json({ message: "Password reset link has been sent to your email." });
}
