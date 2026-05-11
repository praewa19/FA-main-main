import { createSupabaseServerClient, getCurrentUser, requireVerified } from "@/lib/auth";
import { toInvestmentHolding } from "@/lib/data";
import {
  buildInvestmentPageInsights,
  buildPortfolioRangeSeries,
  buildSyntheticHistorySeries,
  buildTrendSeries,
  computeHoldingSnapshot,
  fallbackWatchlistData,
  marketWatchlist,
  summarizePortfolio,
} from "@/lib/investments";
import { getCachedMarketSnapshot, setCachedMarketSnapshot } from "@/lib/market-session-cache";

const API_BASE = "https://api.twelvedata.com";
const INDIAN_API_BASE = "https://stock.indianapi.in";

function apiKey() {
  return process.env.TWELVE_DATA_API_KEY || "";
}

function indianApiKey() {
  return process.env.INDIAN_API_KEY || process.env.STOCK_INDIANAPI_KEY || "";
}

async function fetchTwelveData(path, params = {}) {
  const key = apiKey();
  if (!key) return null;
  const search = new URLSearchParams({ ...params, apikey: key });
  const response = await fetch(`${API_BASE}${path}?${search.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data?.status === "error") {
    throw new Error(data?.message || "Market data request failed.");
  }
  return data;
}

async function fetchIndianApi(path, params = {}) {
  const key = indianApiKey();
  if (!key) return null;
  const search = new URLSearchParams(params);
  const response = await fetch(`${INDIAN_API_BASE}${path}?${search.toString()}`, {
    cache: "no-store",
    headers: {
      "x-api-key": key,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Indian market data request failed.");
  }
  return data;
}

function isIndiaPlanLimitation(error) {
  return String(error?.message || "").includes("available starting with the Grow or Venture plan");
}

function isIndianExchange(exchange = "") {
  return ["NSE", "BSE"].includes(String(exchange || "").toUpperCase());
}

function exchangePriceKey(exchange = "") {
  return String(exchange || "").toUpperCase() === "BSE" ? "BSE" : "NSE";
}

function normalizeIndianSearchResults(items = []) {
  return items.flatMap((item) => {
    const results = [];
    if (item.exchangeCodeNsi) {
      results.push({
        symbol: item.exchangeCodeNsi,
        name: item.commonName || item.companyName || item.exchangeCodeNsi,
        exchange: "NSE",
        currency: "INR",
        type: item.stockType || "Equity",
        country: "India",
      });
    }
    if (item.exchangeCodeBse) {
      results.push({
        symbol: item.exchangeCodeBse,
        name: item.commonName || item.companyName || item.exchangeCodeBse,
        exchange: "BSE",
        currency: "INR",
        type: item.stockType || "Equity",
        country: "India",
      });
    }
    return results;
  });
}

function computePreviousFromPercent(currentPrice, percentChange) {
  const percent = Number(percentChange || 0);
  if (!currentPrice || !Number.isFinite(percent)) return currentPrice;
  const factor = 1 + (percent / 100);
  return factor !== 0 ? currentPrice / factor : currentPrice;
}

function normalizeIndianHistory(data) {
  const priceDataset = (data?.datasets || []).find((dataset) => String(dataset.metric || "").toLowerCase() === "price")
    || (data?.datasets || [])[0];
  return buildTrendSeries(priceDataset?.values || []);
}

function normalizeTwelveQuote(quote) {
  return {
    close: Number(quote?.close ?? quote?.price ?? quote?.last ?? 0),
    previous_close: Number(quote?.previous_close ?? quote?.close ?? 0),
  };
}

async function fetchIndianEquitySnapshot(holding) {
  const [payload, history] = await Promise.all([
    fetchIndianApi("/stock", { name: holding.symbol }),
    fetchIndianApi("/historical_data", { stock_name: holding.symbol, period: "1yr", filter: "price" }),
  ]);
  if (!payload) return null;
  const exchange = String(holding.exchange || "NSE").toUpperCase();
  const series = normalizeIndianHistory(history);
  const latestSeriesPrice = Number(series[series.length - 1]?.price || 0);
  const previousSeriesPrice = Number(series[series.length - 2]?.price || latestSeriesPrice || 0);
  const livePrice = Number(payload?.currentPrice?.[exchangePriceKey(exchange)] || 0);
  const currentPrice = livePrice > 0 ? livePrice : latestSeriesPrice;
  const percentChange = Number(payload?.percentChange || 0);
  const computedPreviousClose = computePreviousFromPercent(currentPrice, percentChange);
  const previousClose = computedPreviousClose > 0 ? computedPreviousClose : previousSeriesPrice || currentPrice;
  const normalizedSeries = series.length ? series : buildSyntheticHistorySeries(currentPrice, previousClose, 22);
  return computeHoldingSnapshot(
    { ...holding, name: payload?.companyName || holding.name, currency: "INR" },
    { close: currentPrice, previous_close: previousClose },
    normalizedSeries,
  );
}

async function fetchTwelveHoldingSnapshot(holding) {
  const [quote, history] = await Promise.all([
    fetchTwelveData("/quote", { symbol: holding.symbol, exchange: holding.exchange || undefined }),
    fetchTwelveData("/time_series", { symbol: holding.symbol, exchange: holding.exchange || undefined, interval: "1day", outputsize: "260", order: "ASC" }),
  ]);
  return computeHoldingSnapshot(holding, normalizeTwelveQuote(quote), buildTrendSeries(history?.values || []));
}

async function buildWatchlist(usdInrRate = 0) {
  if (!apiKey() && !indianApiKey()) return fallbackWatchlistData();

  return Promise.all(marketWatchlist.map(async (item) => {
    try {
      if (item.kind === "stock" && indianApiKey()) {
        const [payload, history] = await Promise.all([
          fetchIndianApi("/stock", { name: item.symbol }),
          fetchIndianApi("/historical_data", { stock_name: item.symbol, period: "1m", filter: "price" }),
        ]);
        const currentPrice = Number(payload?.currentPrice?.[exchangePriceKey(item.exchange)] || 0);
        const percentChange = Number(payload?.percentChange || 0);
        const previousPrice = computePreviousFromPercent(currentPrice, percentChange);
        return {
          ...item,
          previousPrice,
          currentPrice,
          todayChange: currentPrice - previousPrice,
          todayChangePercent: percentChange,
          chart: normalizeIndianHistory(history).slice(-22),
          currency: "INR",
        };
      }

      const [quote, history] = await Promise.all([
        fetchTwelveData("/quote", { symbol: item.symbol }),
        fetchTwelveData("/time_series", { symbol: item.symbol, interval: "1day", outputsize: "22", order: "ASC" }),
      ]);
      const quoteCurrency = quote?.currency || (item.symbol.includes("/USD") ? "USD" : "INR");
      const fxMultiplier = quoteCurrency === "USD" && usdInrRate > 0 ? usdInrRate : 1;
      const currentPrice = Number(quote?.close ?? quote?.price ?? quote?.last ?? 0) * fxMultiplier;
      const previousPrice = Number(quote?.previous_close ?? quote?.close ?? 0) * fxMultiplier;
      const todayChange = currentPrice - previousPrice;
      const todayChangePercent = previousPrice > 0 ? Number((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(2)) : 0;
      return {
        ...item,
        previousPrice,
        currentPrice,
        todayChange,
        todayChangePercent,
        chart: buildTrendSeries(history?.values || [], fxMultiplier).slice(-22),
        currency: "INR",
      };
    } catch {
      return fallbackWatchlistData().find((fallback) => fallback.symbol === item.symbol) || null;
    }
  })).then((items) => items.filter(Boolean));
}

async function portfolioSnapshot(currentUserId) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("investment_holdings")
    .select("*")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: true });

  if (error && !["42P01", "PGRST205"].includes(error.code)) throw error;

  const holdings = (data || []).map(toInvestmentHolding);
  const marketConfigured = Boolean(apiKey());
  const indianMarketConfigured = Boolean(indianApiKey());
  let providerStatus = marketConfigured || indianMarketConfigured ? "configured" : "missing_key";
  let usdInrRate = 0;

  if (marketConfigured) {
    try {
      const fxQuote = await fetchTwelveData("/quote", { symbol: "USD/INR" });
      usdInrRate = Number(fxQuote?.close ?? fxQuote?.price ?? fxQuote?.last ?? 0);
    } catch {
      usdInrRate = 0;
    }
  }

  const positions = await Promise.all(holdings.map(async (holding) => {
    if (indianMarketConfigured && isIndianExchange(holding.exchange)) {
      try {
        return await fetchIndianEquitySnapshot(holding);
      } catch {
        providerStatus = "indian_api_error";
      }
    }

    if (!marketConfigured) {
      const fallbackPrice = holding.shares > 0 ? Number(holding.totalCost) / Number(holding.shares) : 0;
      return computeHoldingSnapshot(holding, { close: fallbackPrice, previous_close: fallbackPrice }, []);
    }

    try {
      return await fetchTwelveHoldingSnapshot(holding);
    } catch (fetchError) {
      if (isIndiaPlanLimitation(fetchError) && isIndianExchange(holding.exchange)) {
        providerStatus = "india_plan_upgrade_required";
      }
      const fallbackPrice = holding.shares > 0 ? Number(holding.totalCost) / Number(holding.shares) : 0;
      return computeHoldingSnapshot(holding, { close: fallbackPrice, previous_close: fallbackPrice }, []);
    }
  }));

  const rangeSeries = buildPortfolioRangeSeries(positions);
  const watchlist = await buildWatchlist(usdInrRate);

  return {
    holdings,
    positions,
    summary: summarizePortfolio(positions, rangeSeries),
    watchlist,
    insights: buildInvestmentPageInsights({ portfolio: positions, watchlist, pageHasHoldings: positions.length > 0 }),
    marketConfigured,
    indianMarketConfigured,
    providerStatus,
  };
}

export async function GET(request) {
  const current = await getCurrentUser();
  const authError = requireVerified(current);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "portfolio";

  try {
    if (mode === "search") {
      const query = (searchParams.get("query") || "").trim();
      if (!query) return Response.json({ results: [] });
      if (indianApiKey()) {
        try {
          const data = await fetchIndianApi("/industry_search", { query });
          return Response.json({
            results: normalizeIndianSearchResults(data || []).slice(0, 8),
            marketConfigured: true,
            provider: "indianapi",
          });
        } catch {
          // Fall through to Twelve Data.
        }
      }
      if (!apiKey()) return Response.json({ results: [], marketConfigured: false });
      const data = await fetchTwelveData("/symbol_search", { symbol: query, outputsize: "8" });
      return Response.json({
        results: (data?.data || []).map((item) => ({
          symbol: item.symbol,
          name: item.instrument_name || item.name || item.symbol,
          exchange: item.exchange || "",
          currency: item.currency || "INR",
          type: item.instrument_type || item.type || "Common Stock",
          country: item.country || "",
        })),
        provider: "twelvedata",
      });
    }

    if (mode === "portfolio") {
      const cachedSnapshot = getCachedMarketSnapshot(current.id);
      if (cachedSnapshot) return Response.json(cachedSnapshot);
      return Response.json(setCachedMarketSnapshot(current.id, await portfolioSnapshot(current.id)));
    }

    return Response.json({ error: "Unsupported market mode." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Market data request failed." }, { status: 400 });
  }
}
