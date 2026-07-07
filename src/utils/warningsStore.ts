import fs from "fs";
import path from "path";

export interface WarningRecord {
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "warnings.json");

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readAll(): WarningRecord[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as WarningRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: WarningRecord[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

export function addWarning(userId: string, moderatorId: string, reason: string): WarningRecord {
  const records = readAll();
  const record: WarningRecord = { userId, moderatorId, reason, timestamp: Date.now() };
  records.push(record);
  writeAll(records);
  return record;
}

export function getWarnings(userId: string): WarningRecord[] {
  return readAll().filter(r => r.userId === userId);
}

// NOTE: this stores data as a JSON file on local disk. Railway's filesystem is
// ephemeral across redeploys, so warnings will be wiped whenever the service
// rebuilds. This is fine to get the bot running, but for anything you care
// about long-term, swap this out for a real database (e.g. Postgres via a
// Railway plugin) — the addWarning/getWarnings function signatures can stay
// the same so the command files won't need to change.
