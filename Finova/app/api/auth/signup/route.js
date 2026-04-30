import { z } from "zod";
import { createSupabaseServerClient, getPublicUserFromAuthResponse, supabaseConfigError } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request) {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter a valid email and an 8+ character password." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({
    user: data.session && data.user ? await getPublicUserFromAuthResponse(data.user) : null,
    message: data.session ? "Account created." : "Account created. Check your email to confirm your address before logging in.",
  });
}
