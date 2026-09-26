import fs from "fs";
import path from "path";
import { runPipeline } from "./runOnce.js";

// Load env vars from platform secrets and local .env
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

loadEnv();

const LOG_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "logs");

function logToFile(message) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logFile = path.join(LOG_DIR, "run.log");
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, line);
}

/**
 * Parse a "HH:MM" schedule string and return ms until the next occurrence (UTC).
 * @param {string} schedule - e.g. "08:00"
 * @returns {number} milliseconds until next run
 */
function msUntilNext(schedule) {
  const [h, m] = schedule.split(":").map(Number);
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0, 0));
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

const SCHEDULE = process.env.DAILY_SCHEDULE || "08:00";
const DRY_RUN = process.argv.includes("--dry-run");

async function runScheduled() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`[${new Date().toISOString()}] Scheduled run starting`);
  console.log(`${"=".repeat(50)}`);

  try {
    await runPipeline({ dryRun: DRY_RUN });
    logToFile("Scheduled run: success");
  } catch (err) {
    logToFile(`Scheduled run: failed — ${err.message}`);
    console.error(`Scheduled run failed: ${err.message}`);
  }

  // Schedule next run
  const wait = msUntilNext(SCHEDULE);
  const nextTime = new Date(Date.now() + wait).toISOString();
  console.log(`\nNext run scheduled for ${nextTime} (UTC)`);
  logToFile(`Next run: ${nextTime}`);
  setTimeout(runScheduled, wait);
}

// Initial scheduling
const initialWait = msUntilNext(SCHEDULE);
const firstRun = new Date(Date.now() + initialWait).toISOString();
console.log(`Scheduler started. Daily schedule: ${SCHEDULE} UTC`);
console.log(`First run: ${firstRun}`);
logToFile(`Scheduler started. Schedule: ${SCHEDULE} UTC. First run: ${firstRun}`);
setTimeout(runScheduled, initialWait);
