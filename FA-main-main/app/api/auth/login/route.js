import { z } from "zod";
import { createSupabaseServerClient, getPublicUserFromAuthResponse, supabaseConfigError } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request) {
  const configError = supabaseConfigError();
  if (configError) return configError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Email and password are required." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });

  if (error) return Response.json({ error: error.message }, { status: 401 });

  return Response.json({ user: await getPublicUserFromAuthResponse(data.user) });
}
