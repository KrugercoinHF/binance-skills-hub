# Creator Generator

Fetches live Binance market data, generates crypto insights, and publishes them to Binance Square.

## How it works

1. **`marketData.js`** — Fetches 24h ticker stats from the Binance public API, filters by quote asset and minimum volume, and ranks top gainers, losers, and volume leaders.
2. **`insights.js`** — Transforms raw market data into structured insights: market sentiment, standout movers, and formatted summaries.
3. **`postTemplates.js`** — Renders insights into Binance Square post content. Picks a mover spotlight for bullish markets or a full market update otherwise.
4. **`squarePublisher.js`** — Publishes the generated post to Binance Square using the existing `square-post` skill scripts.
5. **`runOnce.js`** — Orchestrates the pipeline: fetch → analyze → format → publish. Supports `--dry-run` to preview without publishing.

## Quick start

```bash
# Dry run — fetch data and print the post without publishing
node src/runOnce.js --dry-run

# Live run — requires BINANCE_SQUARE_OPENAPI_KEY
BINANCE_SQUARE_OPENAPI_KEY=<your-key> node src/runOnce.js
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `BINANCE_SQUARE_OPENAPI_KEY` | — | Binance Square OpenAPI key (required to publish) |
| `MARKET_QUOTES` | `USDT` | Comma-separated quote assets to track |
| `MARKET_TOP_N` | `5` | Number of top movers per category |
| `MARKET_MIN_VOLUME` | `10000000` | Minimum 24h quote volume to qualify ($10M) |
| `BINANCE_API_BASE` | `https://api.binance.com` | Binance public API base URL |

Get your Square OpenAPI key at: https://www.binance.com/square/creator-center/home

## Docker

```bash
docker build -t creator-generator .
docker run --rm -e BINANCE_SQUARE_OPENAPI_KEY=<key> creator-generator node src/runOnce.js
```

## Logs

Each run appends to `logs/run.log` with a timestamp, status, and published post ID/link.

## Project structure

```
creator-generator/
├── src/
│   ├── marketData.js      # Fetch & filter Binance market data
│   ├── insights.js        # Generate structured insights
│   ├── postTemplates.js   # Render insights into Square post content
│   ├── squarePublisher.js # Publish to Binance Square
│   └── runOnce.js         # Entry point — orchestrates the pipeline
├── logs/
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

## Dependencies

- **Node.js 18+** — uses built-in `fetch`, ES modules, no npm packages.
- **Binance Square OpenAPI key** — only needed for publishing, not for dry runs.
- Integrates with the existing `skills/binance/square-post/` scripts for publishing.
