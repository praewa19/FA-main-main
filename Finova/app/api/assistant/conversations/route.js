import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromAssistantConversation, toAssistantConversation } from "@/lib/data";
import { id, nowIso } from "@/lib/store";

function isMissingTable(error) {
  return error && ["42P01", "PGRST205"].includes(error.code);
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
  modelUsed: z.string().max(120).optional(),
  createdAt: z.string().optional(),
});

const conversationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120),
  sourcePage: z.string().min(1).max(32).default("assistant"),
  messages: z.array(messageSchema).max(100),
});

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assistant_conversations")
    .select("*")
    .eq("user_id", current.id)
    .order("updated_at", { ascending: false });

  if (isMissingTable(error)) return Response.json({ conversations: [], schemaMissing: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ conversations: (data || []).map(toAssistantConversation) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = conversationSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Save a valid conversation." }, { status: 400 });

  const now = nowIso();
  const conversation = fromAssistantConversation({
    id: parsed.data.id || id("chat"),
    userId: current.id,
    title: parsed.data.title,
    sourcePage: parsed.data.sourcePage,
    messages: parsed.data.messages,
    createdAt: now,
    updatedAt: now,
  });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("assistant_conversations").insert(conversation).select("*").single();
  if (isMissingTable(error)) return Response.json({ error: "Run the latest Supabase migration to enable assistant conversation history." }, { status: 400 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ conversation: toAssistantConversation(data) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = conversationSchema.extend({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Update a valid conversation." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assistant_conversations")
    .update({
      title: parsed.data.title,
      source_page: parsed.data.sourcePage,
      messages: parsed.data.messages,
      updated_at: nowIso(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();

  if (isMissingTable(error)) return Response.json({ error: "Run the latest Supabase migration to enable assistant conversation history." }, { status: 400 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Conversation not found." }, { status: 404 });
  return Response.json({ conversation: toAssistantConversation(data) });
}
