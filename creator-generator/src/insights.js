/**
 * Generate human-readable insights from market data.
 * @param {Object} marketData - Output of getMarketData()
 * @returns {Object} Structured insights for template rendering
 */
export function generateInsights(marketData) {
  const { gainers, losers, topVolume, timestamp, quoteCount } = marketData;

  const bestGainer = gainers[0];
  const worstLoser = losers[0];
  const hottestPair = topVolume[0];

  // Compute overall market sentiment from average change of top volume pairs
  const avgChange = topVolume.reduce((sum, t) => sum + t.priceChangePercent, 0) / topVolume.length;
  const sentiment = avgChange > 2 ? "bullish" : avgChange < -2 ? "bearish" : "neutral";

  // Format volume for readability
  const fmtVol = (v) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(0)}K`;
  };

  // Format price
  const fmtPrice = (p) => {
    if (p >= 1000) return `$${p.toFixed(2)}`;
    if (p >= 1) return `$${p.toFixed(4)}`;
    return `$${p.toFixed(6)}`;
  };

  return {
    timestamp,
    quoteCount,
    sentiment,
    avgChange: avgChange.toFixed(2),
    bestGainer: bestGainer
      ? { symbol: bestGainer.base, change: bestGainer.priceChangePercent.toFixed(2), price: fmtPrice(bestGainer.lastPrice), volume: fmtVol(bestGainer.quoteVolume) }
      : null,
    worstLoser: worstLoser
      ? { symbol: worstLoser.base, change: worstLoser.priceChangePercent.toFixed(2), price: fmtPrice(worstLoser.lastPrice), volume: fmtVol(worstLoser.quoteVolume) }
      : null,
    hottestPair: hottestPair
      ? { symbol: hottestPair.base, volume: fmtVol(hottestPair.quoteVolume), change: hottestPair.priceChangePercent.toFixed(2) }
      : null,
    gainers: gainers.map((g) => ({ symbol: g.base, change: g.priceChangePercent.toFixed(2), volume: fmtVol(g.quoteVolume) })),
    losers: losers.map((l) => ({ symbol: l.base, change: l.priceChangePercent.toFixed(2), volume: fmtVol(l.quoteVolume) })),
    topVolume: topVolume.map((v) => ({ symbol: v.base, volume: fmtVol(v.quoteVolume), change: v.priceChangePercent.toFixed(2) })),
  };
}

/**
 * Generate a short summary line for logging.
 * @param {Object} insights - Output of generateInsights()
 * @returns {string}
 */
export function summarize(insights) {
  const parts = [];
  if (insights.bestGainer) parts.push(`Top gainer: ${insights.bestGainer.symbol} (+${insights.bestGainer.change}%)`);
  if (insights.worstLoser) parts.push(`Top loser: ${insights.worstLoser.symbol} (${insights.worstLoser.change}%)`);
  if (insights.hottestPair) parts.push(`Hottest: ${insights.hottestPair.symbol} (${insights.hottestPair.volume})`);
  parts.push(`Sentiment: ${insights.sentiment}`);
  return parts.join(" | ");
}
