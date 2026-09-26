/**
 * Post templates for Binance Square content.
 * Voice: a blend of casual/punchy, analytical/data-driven, and hype/energetic.
 * Each template takes insights and returns { title, text }.
 */

function moversList(items) {
  return items
    .map((m) => `🔥 $${m.symbol} ${m.change >= 0 ? "+" : ""}${m.change}%  |  vol ${m.volume}`)
    .join("\n");
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

  const title = `Crypto Market Pulse — ${date} UTC`;

  const sentimentEmoji = { bullish: "🚀", bearish: "🩸", neutral: "⚖️" }[insights.sentiment] || "📊";
  const sentimentLabel = { bullish: "BULLISH", bearish: "BEARISH", neutral: "NEUTRAL" }[insights.sentiment] || "NEUTRAL";

  const lines = [
    `gm crypto fam ☀️ Here's what the market's been cooking overnight 👇`,
    ``,
    `${sentimentEmoji} **Vibe check: ${sentimentLabel}** — top pairs averaging ${insights.avgChange >= 0 ? "+" : ""}${insights.avgChange}% in the last 24h`,
    ``,
  ];

  if (insights.bestGainer) {
    lines.push(`🚀 **Biggest winner**: $${insights.bestGainer.symbol} absolutely sending it — **+${insights.bestGainer.change}%** to ${insights.bestGainer.price}, with ${insights.bestGainer.volume} in volume. That's not noise, that's conviction.`);
  }
  if (insights.worstLoser) {
    lines.push(`🩸 **Rough one**: $${insights.worstLoser.symbol} down **${insights.worstLoser.change}%** to ${insights.worstLoser.price}. ${insights.worstLoser.volume} changed hands — someone's taking the L.`);
  }

  lines.push(
    ``,
    `📈 **Top Gainers**`,
    moversList(insights.gainers),
    ``,
    `📉 **Top Losers**`,
    moversList(insights.losers),
    ``,
    `💰 **Where the money's flowing** (highest volume)`,
    moversList(insights.topVolume),
    ``,
    `Numbers don't lie — but they do change fast. DYOR and stay sharp out there 🫡`,
    ``,
    `#Binance #Crypto #MarketUpdate #DeFi`,
  );

  return { title, text: lines.join("\n") };
}

/**
 * Short spotlight post — focuses on a single standout mover.
 */
export function moverSpotlight(insights) {
  if (!insights.bestGainer) return null;

  const g = insights.bestGainer;
  const title = `$${g.symbol} is UP ${g.change}% — here's the tea ☕`;

  const text = [
    `Okay so $${g.symbol} just went **+${g.change}%** in 24h and I had to say something 💀`,
    ``,
    `Price: ${g.price}  |  Volume: ${g.volume}`,
    ``,
    `That volume tells me this isn't just a dead-cat bounce — real money is moving. But don't FOMO in blindly. Check the order book, look at the higher timeframes, and ask yourself: is this the start of something bigger or are we about to get a pullback?`,
    ``,
    `I'm watching this one closely. Let's see if it holds 👀`,
    ``,
    `#$${g.symbol} #Crypto #Binance #TradingSignals`,
  ].join("\n");

  return { title, text };
}

/**
 * Bearish spotlight — focuses on the biggest loser with a cautionary angle.
 */
export function loserSpotlight(insights) {
  if (!insights.worstLoser) return null;

  const l = insights.worstLoser;
  const title = `$${l.symbol} down ${l.change}% — what's happening? 🧐`;

  const text = [
    `Not gonna sugarcoat it — $${l.symbol} is down **${l.change}%** to ${l.price} and ${l.volume} in volume says a LOT of people are exiting.`,
    ``,
    `Could be a healthy correction after a run, or something fundamental shifted. Either way: don't catch a falling knife without a plan. Watch for support levels and a volume dry-up before considering an entry.`,
    ``,
    `Stay safe out there 🫡`,
    ``,
    `#$${l.symbol} #Crypto #Binance #RiskManagement`,
  ].join("\n");

  return { title, text };
}

/**
 * Pick the best template based on market sentiment.
 * Bullish → spotlight the top gainer; bearish → spotlight the loser; neutral → full market update.
 */
export function pickTemplate(insights) {
  if (insights.sentiment === "bullish" && insights.bestGainer) {
    return moverSpotlight(insights);
  }
  if (insights.sentiment === "bearish" && insights.worstLoser) {
    return loserSpotlight(insights);
  }
  return marketUpdate(insights);
}
