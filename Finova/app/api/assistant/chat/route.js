import { getCurrentUser, requireVerified } from "@/lib/auth";
import { assistantChatSchema, geminiClient, generateAssistantChatReply, loadAssistantContext } from "@/lib/assistant";

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = assistantChatSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Send a valid chat message." }, { status: 400 });

  const ai = geminiClient();
  if (!ai) {
    return Response.json({ error: "Set GEMINI_API_KEY before using the AI assistant." }, { status: 503 });
  }

  try {
    const context = await loadAssistantContext(current.id);
    const result = await generateAssistantChatReply({
      ai,
      page: parsed.data.page,
      context,
      messages: parsed.data.messages,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message || "AI request failed." }, { status: 400 });
  }
}
