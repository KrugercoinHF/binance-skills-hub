import fs from "fs";
import path from "path";
import { getMarketData } from "./marketData.js";
import { generateInsights, summarize } from "./insights.js";
import { pickTemplate } from "./postTemplates.js";
import { publishToSquare } from "./squarePublisher.js";

// Load env vars from platform secrets and local .env (does not override existing env)
function loadEnv() {
  const files = ["/run/base44/app.env", path.join(path.dirname(new URL(import.meta.url).pathname), "..", ".env")];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const LOG_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "logs");

function logToFile(message) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logFile = path.join(LOG_DIR, "run.log");
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, line);
}

/**
 * Run the full pipeline once: fetch data → generate insights → format → publish.
 * @param {{ dryRun?: boolean }} opts
 */
export async function runPipeline(opts = {}) {
  const { dryRun = false } = opts;

  console.log("Fetching market data...");
  const marketData = await getMarketData();
  console.log(`  ${marketData.quoteCount} qualifying pairs found`);

  console.log("Generating insights...");
  const insights = generateInsights(marketData);
  console.log(`  ${summarize(insights)}`);

  const post = pickTemplate(insights);
  if (!post) {
    console.log("No suitable template for current market conditions. Skipping.");
    logToFile("Skipped: no suitable template");
    return;
  }

  console.log("\n--- Generated Post ---");
  console.log(`Title: ${post.title || "(none)"}`);
  console.log(`\n${post.text}\n`);
  console.log("--- End Post ---\n");

  if (dryRun) {
    console.log("Dry run — skipping publish.");
    logToFile("Dry run completed");
    return;
  }

  try {
    const result = await publishToSquare(post);
    logToFile(`Published: id=${result.id}, link=${result.link}`);
  } catch (err) {
    console.error(`\nPublish failed: ${err.message}`);
    logToFile(`Publish failed: ${err.message}`);
    throw err;
  }
}

// When run directly (not imported), execute once
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const isDryRun = process.argv.includes("--dry-run");
  runPipeline({ dryRun: isDryRun }).catch((err) => {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  });
}
