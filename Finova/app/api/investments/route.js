import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { fromInvestmentHolding, toInvestmentHolding } from "@/lib/data";
import { invalidateCachedMarketSnapshot } from "@/lib/market-session-cache";
import { id, nowIso } from "@/lib/store";

const holdingSchema = z.object({
  symbol: z.string().min(1).max(24),
  name: z.string().min(1).max(120),
  shares: z.coerce.number().positive(),
  totalCost: z.coerce.number().positive(),
  assetType: z.enum(["stock", "etf", "fund"]).optional(),
  exchange: z.string().max(32).optional(),
  currency: z.string().min(3).max(8).optional(),
});

const updateSchema = holdingSchema.extend({
  id: z.string().min(1),
});

function isMissingTable(error) {
  return error && ["42P01", "PGRST205"].includes(error.code);
}

export async function GET() {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("*")
    .eq("user_id", current.id)
    .order("created_at", { ascending: true });

  if (isMissingTable(error)) return Response.json({ holdings: [], schemaMissing: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ holdings: (data || []).map(toInvestmentHolding) });
}

export async function POST(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = z.object({ holdings: z.array(holdingSchema).min(1).max(25) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid holdings before saving the portfolio." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: existingRows, error: existingError } = await supabase
    .from("investment_holdings")
    .select("*")
    .eq("user_id", current.id);

  if (isMissingTable(existingError)) {
    return Response.json({ error: "Run the latest Supabase migration to enable investment holdings." }, { status: 400 });
  }
  if (existingError) return Response.json({ error: existingError.message }, { status: 400 });

  const existingBySymbol = new Map((existingRows || []).map((row) => [row.symbol, row]));
  const rows = parsed.data.holdings.map((holding) => {
    const symbol = holding.symbol.trim().toUpperCase();
    const existing = existingBySymbol.get(symbol);
    return fromInvestmentHolding({
      id: existing?.id || id("holding"),
      userId: current.id,
      symbol,
      name: holding.name.trim(),
      shares: Number(existing?.shares || 0) + holding.shares,
      totalCost: Number(existing?.total_cost || 0) + holding.totalCost,
      assetType: holding.assetType || existing?.asset_type || "stock",
      exchange: holding.exchange?.trim() || existing?.exchange || null,
      currency: holding.currency?.trim().toUpperCase() || existing?.currency || "INR",
      createdAt: existing?.created_at || nowIso(),
      updatedAt: nowIso(),
    });
  });

  const { data, error } = await supabase
    .from("investment_holdings")
    .upsert(rows, { onConflict: "user_id,symbol" })
    .select("*");

  if (isMissingTable(error)) {
    return Response.json({ error: "Run the latest Supabase migration to enable investment holdings." }, { status: 400 });
  }
  if (error) return Response.json({ error: error.message }, { status: 400 });
  invalidateCachedMarketSnapshot(current.id);
  return Response.json({ holdings: (data || []).map(toInvestmentHolding) });
}

export async function PATCH(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter valid holding details." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const updates = {
    symbol: parsed.data.symbol.trim().toUpperCase(),
    name: parsed.data.name.trim(),
    shares: parsed.data.shares,
    total_cost: parsed.data.totalCost,
    asset_type: parsed.data.assetType || "stock",
    exchange: parsed.data.exchange?.trim() || null,
    currency: parsed.data.currency?.trim().toUpperCase() || "INR",
    updated_at: nowIso(),
  };

  const { data, error } = await supabase
    .from("investment_holdings")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("*")
    .maybeSingle();

  if (isMissingTable(error)) {
    return Response.json({ error: "Run the latest Supabase migration to enable investment holdings." }, { status: 400 });
  }
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Holding not found." }, { status: 404 });
  invalidateCachedMarketSnapshot(current.id);
  return Response.json({ holding: toInvestmentHolding(data) });
}

export async function DELETE(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Choose a holding to remove." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("investment_holdings")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", current.id)
    .select("id")
    .maybeSingle();

  if (isMissingTable(error)) return Response.json({ ok: true, schemaMissing: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Holding not found." }, { status: 404 });
  invalidateCachedMarketSnapshot(current.id);
  return Response.json({ ok: true });
}
