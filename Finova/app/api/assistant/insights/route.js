import { z } from "zod";
import { getCurrentUser, requireVerified } from "@/lib/auth";
import { geminiClient, generatePageInsights, getCachedInsights, loadAssistantContext, pageInsightsFingerprint, setCachedInsights } from "@/lib/assistant";

const schema = z.object({
  page: z.string().min(1).max(32),
});

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Send a valid insights request." }, { status: 400 });

  const ai = geminiClient();
  if (!ai) {
    return Response.json({ error: "Set GEMINI_API_KEY before using AI insights." }, { status: 503 });
  }

  try {
    const context = await loadAssistantContext(current.id);
    const fingerprint = pageInsightsFingerprint(parsed.data.page, context);
    const cached = getCachedInsights(current.id, parsed.data.page, fingerprint);
    if (cached) {
      return Response.json({ ...cached, cached: true, fingerprint });
    }

    const result = await generatePageInsights({
      ai,
      page: parsed.data.page,
      context,
    });
    setCachedInsights(current.id, parsed.data.page, fingerprint, result);
    return Response.json({ ...result, cached: false, fingerprint });
  } catch (error) {
    return Response.json({ error: error.message || "AI insights request failed." }, { status: 400 });
  }
}
