import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const VERIFY_ROLE_BUTTON_ID = "verify_role_button";

export interface RoleSyncEntry {
  label: string;
  mainRoleId: string;
  fanRoleId: string;
}

export const ROLE_SYNC_MAP: RoleSyncEntry[] = [
  { label: "Director", mainRoleId: "1518419246303019090", fanRoleId: "1522269027383378041" },
  { label: "Deputy Director", mainRoleId: "1518419247796191384", fanRoleId: "1522269028427628768" },
  { label: "Assistant Director", mainRoleId: "1518419248882516139", fanRoleId: "1522269029702828293" },
  { label: "Community Management", mainRoleId: "1518419252946665663", fanRoleId: "1522270456923689021" },
  { label: "Administration", mainRoleId: "1518419256931516546", fanRoleId: "1522269030784696477" },
  { label: "Junior Administration", mainRoleId: "1518419257958989847", fanRoleId: "1522269030784696477" },
  { label: "Senior Staff", mainRoleId: "1518419258999046244", fanRoleId: "1522269032462549012" },
  { label: "Staff", mainRoleId: "1518419260156678224", fanRoleId: "1522269032462549012" },
  { label: "Staff In Training", mainRoleId: "1518419261280751797", fanRoleId: "1522269032462549012" },
  { label: "Membership", mainRoleId: "1518419263289823244", fanRoleId: "1522269034798645358" },
  { label: "MPD", mainRoleId: "1518419278209093765", fanRoleId: "1522269038557008013" },
  { label: "BCSO", mainRoleId: "1518419276413931672", fanRoleId: "1522269037395050559" },
  { label: "SASP", mainRoleId: "1518419274719301733", fanRoleId: "1522269039383019650" },
  { label: "SAFR", mainRoleId: "1518419280931061763", fanRoleId: "1523873703400706138" },
  { label: "CivOps", mainRoleId: "1518419286077472809", fanRoleId: "1523871362010321048" },
  { label: "SACD", mainRoleId: "1518419283565088808", fanRoleId: "1523871492134404178" },
  { label: "Media Team", mainRoleId: "1518419292352151572", fanRoleId: "1522269043304694022" },
  { label: "R&T", mainRoleId: "1518419290687275008", fanRoleId: "1522269036119855236" }
];

// Anyone holding any role from Administration down through Staff In Training
// also receives this additional fan-server role.
export const ADMIN_THROUGH_SIT_MAIN_IDS = [
  "1518419256931516546", // Administration
  "1518419257958989847", // Junior Administration
  "1518419258999046244", // Senior Staff
  "1518419260156678224", // Staff
  "1518419261280751797"  // Staff In Training
];
export const ADMIN_THROUGH_SIT_FAN_ROLE_ID = "1522269040410624060";

// Every fan-server role this feature is allowed to add/remove. Used so the
// button only ever touches roles it manages, never anything else the member
// might have in the fan server.
export const MANAGED_FAN_ROLE_IDS: string[] = Array.from(
  new Set([...ROLE_SYNC_MAP.map(e => e.fanRoleId), ADMIN_THROUGH_SIT_FAN_ROLE_ID])
);

export function computeDesiredFanRoles(mainRoleIds: string[]): string[] {
  const desired = new Set<string>();
  for (const entry of ROLE_SYNC_MAP) {
    if (mainRoleIds.includes(entry.mainRoleId)) desired.add(entry.fanRoleId);
  }
  if (ADMIN_THROUGH_SIT_MAIN_IDS.some(id => mainRoleIds.includes(id))) {
    desired.add(ADMIN_THROUGH_SIT_FAN_ROLE_ID);
  }
  return Array.from(desired);
}

export const VERIFY_ROLE_PANEL_TITLE = "The East Bay Project Roleplay Role Request";

export function buildVerifyRolePanel() {
  const embed = new EmbedBuilder()
    .setTitle(VERIFY_ROLE_PANEL_TITLE)
    .setColor(0x5865f2)
    .setDescription(
      "If you are a member of The East Bay Project Roleplay, click the **Verify Role** button below and I'll match your member, department, and staff roles here in the fan server to your roles in the main server.\n\n" +
      "If you have any questions regarding roles, please ask in this channel."
    )
    .setFooter({ text: "The East Bay Project Roleplay" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(VERIFY_ROLE_BUTTON_ID).setLabel("Verify Role").setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}
