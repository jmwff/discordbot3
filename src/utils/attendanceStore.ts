import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const ATTEND_BUTTON_ID = "patrol_attend";
export const NOT_ATTEND_BUTTON_ID = "patrol_notattend";

// Attendance is stored directly in the embed's "Members Attending" field value
// (as a list of user mentions), not in a local file. Railway's filesystem is
// wiped on every restart/redeploy, which was causing attendance to silently
// reset — reading state from the message itself means it survives restarts,
// since Discord persists the message regardless of what happens to the bot.

export function parseAttendingIds(fieldValue: string): string[] {
  const matches = fieldValue.match(/<@(\d+)>/g) || [];
  return matches.map(m => m.replace(/[<@>]/g, ""));
}

export function buildAttendanceFieldValue(ids: string[]): string {
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
