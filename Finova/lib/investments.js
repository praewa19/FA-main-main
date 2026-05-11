export const marketWatchlist = [
  { kind: "stock", symbol: "RELIANCE", ticker: "RELIANCE", label: "Reliance Industries", exchange: "NSE", accent: "#6366F1" },
  { kind: "stock", symbol: "TCS", ticker: "TCS", label: "Tata Consultancy", exchange: "NSE", accent: "#3B82F6" },
  { kind: "stock", symbol: "INFY", ticker: "INFY", label: "Infosys", exchange: "NSE", accent: "#06B6D4" },
  { kind: "stock", symbol: "HDFCBANK", ticker: "HDFCBANK", label: "HDFC Bank", exchange: "NSE", accent: "#10B981" },
  { kind: "stock", symbol: "ITC", ticker: "ITC", label: "ITC", exchange: "NSE", accent: "#F59E0B" },
  { kind: "stock", symbol: "SBIN", ticker: "SBIN", label: "State Bank of India", exchange: "NSE", accent: "#F97316" },
  { kind: "stock", symbol: "SUNPHARMA", ticker: "SUNPHARMA", label: "Sun Pharma", exchange: "NSE", accent: "#EC4899" },
  { kind: "commodity", symbol: "XAU/USD", ticker: "GOLD", label: "Gold", subtitle: "Spot gold", accent: "#E3A008" },
  { kind: "commodity", symbol: "XAG/USD", ticker: "SILVER", label: "Silver", subtitle: "Spot silver", accent: "#94A3B8" },
  { kind: "commodity", symbol: "BRENT", ticker: "BRENT", label: "Brent Crude", subtitle: "Oil benchmark", accent: "#FB7185" },
];

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundMoney(value) {
  return Number(num(value).toFixed(2));
}

function sortSeries(series = []) {
  return [...series].sort((a, b) => String(a.date || a.label || "").localeCompare(String(b.date || b.label || "")));
}

export function buildTrendSeries(values = [], multiplier = 1) {
  return sortSeries(values
    .map((entry) => {
      if (Array.isArray(entry)) {
        return {
          date: entry[0],
          label: entry[0],
          price: roundMoney(num(entry[1]) * multiplier),
        };
      }
      return {
        date: entry.date || entry.datetime || entry.label || "",
        label: entry.datetime || entry.label || entry.date || "",
        price: roundMoney(num(entry.close ?? entry.price ?? entry.value) * multiplier),
      };
    })
    .filter((entry) => entry.price > 0));
}

export function buildDaySeries(previousPrice = 0, currentPrice = 0) {
  if (previousPrice <= 0 || currentPrice <= 0) return [];
  return Array.from({ length: 8 }, (_, index) => {
    const progress = index / 7;
    const price = previousPrice + ((currentPrice - previousPrice) * progress);
    return {
      label: `P${index + 1}`,
      date: `P${index + 1}`,
      price: roundMoney(price),
    };
  });
}

export function buildSyntheticHistorySeries(currentPrice = 0, previousClose = 0, points = 22, endDate = new Date()) {
  if (currentPrice <= 0 || previousClose <= 0 || points < 2) return [];
  const startPrice = previousClose * 0.975;
  const drift = currentPrice - startPrice;

  return Array.from({ length: points }, (_, index) => {
    const progress = points === 1 ? 1 : index / (points - 1);
    const swing = Math.sin(progress * Math.PI * 2.2) * Math.max(0.5, Math.abs(drift) * 0.05);
    const date = new Date(endDate);
    date.setDate(date.getDate() - (points - 1 - index));
    const isoDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    return {
      label: isoDate,
      date: isoDate,
      price: roundMoney(startPrice + (drift * progress) + swing),
    };
  });
}

export function computeHoldingSnapshot(holding, quote, series = []) {
  const shares = num(holding.shares);
  const totalCost = num(holding.totalCost);
  const currentPrice = num(quote?.close ?? quote?.price ?? quote?.last ?? quote?.previous_close ?? 0);
  const previousClose = num(quote?.previous_close ?? quote?.close ?? 0);
  const currentValue = currentPrice > 0 ? roundMoney(shares * currentPrice) : 0;
  const unrealizedGain = roundMoney(currentValue - totalCost);
  const unrealizedGainPercent = totalCost > 0 ? roundMoney((unrealizedGain / totalCost) * 100) : 0;
  const todayChange = currentPrice > 0 && previousClose > 0 ? roundMoney(currentPrice - previousClose) : 0;
  const todayChangePercent = previousClose > 0 ? roundMoney((todayChange / previousClose) * 100) : 0;
  const history = sortSeries(series);
  const basePosition = {
    ...holding,
    previousClose,
    currentPrice,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent,
    todayChange,
    todayChangePercent,
    history,
    chart: history.slice(-22),
    trendDirection: todayChange >= 0 ? "Bullish" : "Pullback",
  };
  const rangeSeries = buildPositionRangeSeries(basePosition);
  const rangeMetrics = buildPositionRangeMetrics(basePosition, rangeSeries);

  return {
    ...basePosition,
    rangeSeries,
    rangeMetrics,
  };
}

function historyAfterPurchase(position) {
  const purchaseDate = String(position.createdAt || "").slice(0, 10);
  return sortSeries((position.history || []).filter((point) => !purchaseDate || String(point.date || "") >= purchaseDate));
}

function sliceSeriesForRange(series = [], rangeKey = "1M") {
  switch (rangeKey) {
    case "1D":
      return series;
    case "5D":
      return series.slice(-5);
    case "1M":
      return series.slice(-22);
    case "3M":
      return series.slice(-66);
    case "ALL":
    default:
      return series;
  }
}

function summarizeRangeSeries(series = [], multiplier = 1) {
  if (!series.length) return {
    startPrice: 0,
    endPrice: 0,
    change: 0,
    changePercent: 0,
  };

  const startPrice = num(series[0]?.price);
  const endPrice = num(series[series.length - 1]?.price);
  const change = roundMoney((endPrice - startPrice) * multiplier);
  const changePercent = startPrice > 0 ? roundMoney(((endPrice - startPrice) / startPrice) * 100) : 0;

  return {
    startPrice,
    endPrice,
    change,
    changePercent,
  };
}

export function buildPositionRangeSeries(position) {
  const usableHistory = historyAfterPurchase(position);
  return {
    "1D": buildDaySeries(num(position.previousClose), num(position.currentPrice)),
    "5D": sliceSeriesForRange(usableHistory, "5D"),
    "1M": sliceSeriesForRange(usableHistory, "1M"),
    "3M": sliceSeriesForRange(usableHistory, "3M"),
    ALL: usableHistory,
  };
}

export function buildPositionRangeMetrics(position, rangeSeries = {}) {
  const shares = num(position.shares);
  return Object.fromEntries(Object.entries(rangeSeries).map(([rangeKey, series]) => [
    rangeKey,
    summarizeRangeSeries(series, shares),
  ]));
}

function aggregateSeries(positions = [], pointsPerRange = null) {
  const datedPositions = positions.map((position) => ({
    ...position,
    usableHistory: historyAfterPurchase(position),
  })).filter((position) => position.usableHistory.length);

  if (!datedPositions.length) return [];
  const allDates = [...new Set(datedPositions.flatMap((position) => position.usableHistory.map((point) => point.date)))].sort();
  const totals = [];

  datedPositions.forEach((position) => {
    position.historyMap = new Map(position.usableHistory.map((point) => [point.date, point.price]));
  });

  allDates.forEach((date) => {
    let total = 0;
    datedPositions.forEach((position) => {
      if (date < String(position.createdAt || "").slice(0, 10)) return;
      const price = position.historyMap.get(date);
      if (!Number.isFinite(price)) return;
      total += num(position.shares) * price;
    });
    if (total > 0) {
      totals.push({
        date,
        label: date,
        price: roundMoney(total),
      });
    }
  });

  if (!pointsPerRange || totals.length <= pointsPerRange) return totals;
  return totals.slice(-pointsPerRange);
}

export function buildPortfolioRangeSeries(positions = []) {
  const oneDayValue = roundMoney(positions.reduce((sum, position) => sum + (num(position.previousClose) * num(position.shares)), 0));
  const currentValue = roundMoney(positions.reduce((sum, position) => sum + num(position.currentValue), 0));
  return {
    "1D": buildDaySeries(oneDayValue, currentValue),
    "5D": aggregateSeries(positions, 5),
    "1M": aggregateSeries(positions, 22),
    "3M": aggregateSeries(positions, 66),
    ALL: aggregateSeries(positions, null),
  };
}

export function summarizePortfolio(positions = [], rangeSeries = {}) {
  const totalInvested = roundMoney(positions.reduce((sum, position) => sum + num(position.totalCost), 0));
  const currentValue = roundMoney(positions.reduce((sum, position) => sum + num(position.currentValue), 0));
  const totalGain = roundMoney(currentValue - totalInvested);
  const totalGainPercent = totalInvested > 0 ? roundMoney((totalGain / totalInvested) * 100) : 0;
  const daySeries = rangeSeries["1D"] || [];
  const dayOpen = num(daySeries[0]?.price);
  const dayClose = num(daySeries[daySeries.length - 1]?.price);
  const dayChange = dayOpen > 0 ? roundMoney(dayClose - dayOpen) : roundMoney(positions.reduce((sum, position) => sum + (num(position.todayChange) * num(position.shares)), 0));
  const dayChangePercent = dayOpen > 0 ? roundMoney((dayChange / dayOpen) * 100) : 0;
  const rangeMetrics = Object.fromEntries(Object.entries(rangeSeries).map(([rangeKey, series]) => [
    rangeKey,
    summarizeRangeSeries(series),
  ]));

  return {
    totalInvested,
    currentValue,
    totalGain,
    totalGainPercent,
    dayChange,
    dayChangePercent,
    holdingCount: positions.length,
    rangeSeries,
    rangeMetrics,
  };
}

function fallbackSeries(start, drift) {
  return Array.from({ length: 22 }, (_, index) => ({
    label: `P${index + 1}`,
    date: `P${index + 1}`,
    price: roundMoney(start + (index * drift) + Math.sin(index / 2) * drift * 2),
  }));
}

export function fallbackWatchlistData() {
  const base = [
    [1455, 4.2],
    [3520, -8.5],
    [1620, 5.1],
    [1887, 7.3],
    [436, -1.4],
    [812, 3.8],
    [1740, 6.4],
    [64120, 180],
    [73450, -120],
    [7120, 32],
  ];

  return marketWatchlist.map((item, index) => {
    const previousPrice = base[index][0];
    const delta = base[index][1];
    const currentPrice = roundMoney(previousPrice + delta);
    const todayChangePercent = previousPrice > 0 ? roundMoney((delta / previousPrice) * 100) : 0;
    return {
      ...item,
      previousPrice,
      currentPrice,
      todayChange: roundMoney(delta),
      todayChangePercent,
      chart: fallbackSeries(previousPrice * 0.96, delta / 4),
      currency: "INR",
    };
  });
}

export function buildInvestmentPageInsights({ portfolio, watchlist, pageHasHoldings }) {
  if (!pageHasHoldings) {
    return [
      "Add your first holdings to unlock range-based portfolio tracking, unrealized P/L, and watchlist context.",
      "Use total cost instead of average price so Finova can compute all-time gain from the moment you add the position.",
    ];
  }

  const topWinner = [...portfolio].sort((a, b) => num(b.unrealizedGainPercent) - num(a.unrealizedGainPercent))[0];
  const largestWeight = [...portfolio].sort((a, b) => num(b.currentValue) - num(a.currentValue))[0];
  const topWatch = [...watchlist].sort((a, b) => num(b.todayChangePercent) - num(a.todayChangePercent))[0];

  return [
    largestWeight ? `${largestWeight.symbol} is the largest position in the portfolio at ${Math.round((num(largestWeight.currentValue) / Math.max(1, portfolio.reduce((sum, position) => sum + num(position.currentValue), 0))) * 100)}% of current value.` : "Portfolio concentration insights will appear once holdings are live.",
    topWinner ? `${topWinner.symbol} is leading unrealized performance at ${topWinner.unrealizedGainPercent >= 0 ? "+" : ""}${topWinner.unrealizedGainPercent.toFixed(2)}%.` : "Unrealized performance becomes available once positions are priced.",
    topWatch ? `${topWatch.label} is moving ${topWatch.todayChangePercent >= 0 ? "higher" : "lower"} today at ${topWatch.todayChangePercent >= 0 ? "+" : ""}${topWatch.todayChangePercent.toFixed(2)}%.` : "Watchlist moves will show here when market data is available.",
  ];
}
