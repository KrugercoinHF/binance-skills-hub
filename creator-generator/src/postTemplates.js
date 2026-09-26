/**
 * Post templates for Binance Square content.
 * Each template takes insights and returns { title, text }.
 */

function moversList(items) {
  return items.map((m) => `• $${m.symbol} ${m.change >= 0 ? "+" : ""}${m.change}% (vol ${m.volume})`).join("\n");
}

/**
 * Market update post — covers sentiment, top gainer, top loser, and volume leaders.
 */
export function marketUpdate(insights) {
  const date = new Date(insights.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const title = `Market Update — ${date} UTC`;

  const lines = [
    `📊 **24h Market Overview**`,
    ``,
    `Sentiment: **${insights.sentiment.toUpperCase()}** (avg ${insights.avgChange >= 0 ? "+" : ""}${insights.avgChange}% among top pairs)`,
    ``,
  ];

  if (insights.bestGainer) {
    lines.push(`🚀 **Top Gainer**: $${insights.bestGainer.symbol} +${insights.bestGainer.change}% — ${insights.bestGainer.price} (vol ${insights.bestGainer.volume})`);
  }
  if (insights.worstLoser) {
    lines.push(`📉 **Top Loser**: $${insights.worstLoser.symbol} ${insights.worstLoser.change}% — ${insights.worstLoser.price} (vol ${insights.worstLoser.volume})`);
  }

  lines.push(``, `**Top Gainers**`, moversList(insights.gainers), ``, `**Top Losers**`, moversList(insights.losers), ``, `🔥 **Highest Volume**`, moversList(insights.topVolume), ``, `#Binance #Crypto #MarketUpdate`);

  return { title, text: lines.join("\n") };
}

/**
 * Short spotlight post — focuses on a single standout mover.
 */
export function moverSpotlight(insights) {
  if (!insights.bestGainer) return null;

  const g = insights.bestGainer;
  const title = `${g.symbol} Surge: +${g.change}% in 24h`;

  const text = [
    `$${g.symbol} is up **+${g.change}%** in the last 24 hours, now trading at ${g.price}.`,
    ``,
    `24h volume: ${g.volume}`,
    ``,
    `Is this the start of a bigger move or a local top? 👀`,
    ``,
    `#$${g.symbol} #Crypto #Binance`,
  ].join("\n");

  return { title, text };
}

/**
 * Pick the best template based on market sentiment.
 * Bullish → spotlight the top gainer; bearish/neutral → full market update.
 */
export function pickTemplate(insights) {
  if (insights.sentiment === "bullish" && insights.bestGainer) {
    return moverSpotlight(insights);
  }
  return marketUpdate(insights);
}
