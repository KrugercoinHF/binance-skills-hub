const API_BASE = process.env.BINANCE_API_BASE || "https://data-api.binance.vision";
const QUOTES = (process.env.MARKET_QUOTES || "USDT").split(",").map((q) => q.trim().toUpperCase());
const TOP_N = parseInt(process.env.MARKET_TOP_N || "5", 10);
const MIN_VOLUME = parseFloat(process.env.MARKET_MIN_VOLUME || "10000000");

/**
 * Fetch 24hr ticker statistics for all symbols from Binance public API.
 * @returns {Promise<Array>} Array of ticker objects
 */
export async function fetch24hrTickers() {
  const url = `${API_BASE}/api/v3/ticker/24hr`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch 24hr tickers: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Filter tickers to the configured quote assets and minimum volume.
 * @param {Array} tickers - Raw ticker data from Binance
 * @returns {Array} Filtered and normalized tickers
 */
export function filterTickers(tickers) {
  return tickers
    .filter((t) => {
      const symbol = t.symbol;
      return QUOTES.some((q) => symbol.endsWith(q)) && !symbol.includes("UP") && !symbol.includes("DOWN");
    })
    .map((t) => ({
      symbol: t.symbol,
      base: t.symbol.replace(new RegExp(`(${QUOTES.join("|")})$`), ""),
      priceChange: parseFloat(t.priceChange),
      priceChangePercent: parseFloat(t.priceChangePercent),
      lastPrice: parseFloat(t.lastPrice),
      volume: parseFloat(t.volume),
      quoteVolume: parseFloat(t.quoteVolume),
      highPrice: parseFloat(t.highPrice),
      lowPrice: parseFloat(t.lowPrice),
    }))
    .filter((t) => t.quoteVolume >= MIN_VOLUME);
}

/**
 * Get top gainers and losers by 24h price change percentage.
 * @param {Array} tickers - Filtered tickers
 * @param {number} n - Number of movers per category
 * @returns {{ gainers: Array, losers: Array }}
 */
export function getTopMovers(tickers, n = TOP_N) {
  const sorted = [...tickers].sort((a, b) => b.priceChangePercent - a.priceChangePercent);
  return {
    gainers: sorted.slice(0, n),
    losers: sorted.slice(-n).reverse(),
  };
}

/**
 * Get the highest volume symbols.
 * @param {Array} tickers - Filtered tickers
 * @param {number} n - Number of symbols
 * @returns {Array}
 */
export function getTopVolume(tickers, n = TOP_N) {
  return [...tickers].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, n);
}

/**
 * Fetch all market data in one call.
 * @returns {Promise<{ tickers: Array, gainers: Array, losers: Array, topVolume: Array, timestamp: string }>}
 */
export async function getMarketData() {
  const raw = await fetch24hrTickers();
  const tickers = filterTickers(raw);
  const { gainers, losers } = getTopMovers(tickers);
  const topVolume = getTopVolume(tickers);

  return {
    tickers,
    gainers,
    losers,
    topVolume,
    timestamp: new Date().toISOString(),
    quoteCount: tickers.length,
  };
}
