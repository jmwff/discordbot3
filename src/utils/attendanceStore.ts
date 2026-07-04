import fs from "fs";
import path from "path";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const ATTEND_BUTTON_ID = "patrol_attend";
export const NOT_ATTEND_BUTTON_ID = "patrol_notattend";

type Status = "attending" | "notattending";

interface AttendanceData {
  [messageId: string]: {
    [userId: string]: Status;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "attendance.json");

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf8");
}

function readAll(): AttendanceData {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as AttendanceData;
  } catch {
    return {};
  }
}

function writeAll(data: AttendanceData): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function setAttendance(messageId: string, userId: string, status: Status): void {
  const data = readAll();
  if (!data[messageId]) data[messageId] = {};
  data[messageId][userId] = status;
  writeAll(data);
}

export function getAttendingUserIds(messageId: string): string[] {
  const record = readAll()[messageId] || {};
  return Object.entries(record)
    .filter(([, status]) => status === "attending")
    .map(([userId]) => userId);
}

export function getAttendingCount(messageId: string): number {
  return getAttendingUserIds(messageId).length;
}

export function buildAttendanceFieldValue(messageId: string): string {
  const ids = getAttendingUserIds(messageId);
  if (ids.length === 0) return "No one has confirmed attendance yet.";
  return ids.map(id => `<@${id}>`).join("\n");
}

export function buildAttendanceRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ATTEND_BUTTON_ID)
      .setLabel("Attending")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(NOT_ATTEND_BUTTON_ID)
      .setLabel("Not Attending")
      .setStyle(ButtonStyle.Danger)
  );
}

// NOTE: like warningsStore.ts, this persists to a local JSON file. Railway's
// filesystem resets on redeploy, so attendance lists reset too. Fine to get
// this working now; move to a real database later if you need it to survive
// redeploys mid-event.
