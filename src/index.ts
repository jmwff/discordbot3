import { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { CONFIG } from "./config";

// Setup Bot Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Setup Commands Collection
export interface SlashCommand {
  data: any;
  category: "Member" | "Staff" | "Admin" | "Leadership";
  execute: (interaction: any) => Promise<any>;
}

export const commandsCollection = new Collection<string, SlashCommand>();

// Helper to check staff permissions
export function isStaff(member: any): boolean {
  if (!member) return false;
  const staffRoles = [
    CONFIG.roles.staffInTraining,
    CONFIG.roles.staff,
    CONFIG.roles.seniorStaff,
    CONFIG.roles.juniorAdmin,
    CONFIG.roles.admin,
    CONFIG.roles.communityManager,
    CONFIG.roles.communityLeadership
  ];
  return member.roles.cache.some((r: any) => staffRoles.includes(r.id)) || member.permissions.has("ManageMessages");
}

// Helper to check admin permissions
export function isAdmin(member: any): boolean {
  if (!member) return false;
  const adminRoles = [
    CONFIG.roles.juniorAdmin,
    CONFIG.roles.admin,
    CONFIG.roles.communityManager,
    CONFIG.roles.communityLeadership
  ];
  return member.roles.cache.some((r: any) => adminRoles.includes(r.id)) || member.permissions.has("Administrator");
}

// Helper to check leadership permissions
export function isLeadership(member: any): boolean {
  if (!member) return false;
  const leadershipRoles = [
    CONFIG.roles.communityManager,
    CONFIG.roles.communityLeadership
  ];
  return member.roles.cache.some((r: any) => leadershipRoles.includes(r.id)) || member.permissions.has("ManageGuild");
}

// Global scope restrictions
const PRIMARY_ONLY_COMMANDS = ["assign", "onboard", "transfer-user", "resign", "guildmanager", "webrole"];

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!\nGuilds initialized: ${CONFIG.allowedGuilds.length}`);
  client.user?.setActivity("The East Bay | /status");

  // Load and register slash commands in allowed guilds
  const rest = new REST({ version: "10" }).setToken(CONFIG.token);
  try {
    const commandFilesData = Array.from(commandsCollection.values()).map(c => c.data.toJSON());
    console.log(`Registering ${commandFilesData.length} slash commands...\nPrimary Guild ID: ${CONFIG.primaryGuildId}`);

    for (const guildId of CONFIG.allowedGuilds) {
      await rest.put(
        Routes.applicationGuildCommands(client.user!.id, guildId),
        { body: commandFilesData }
      ).catch(e => console.error(`Failed to register commands in ${guildId}: `, e.message));
    }
    console.log("Successfully registered commands across all guilds.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
});

// Interaction routing
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsCollection.get(interaction.commandName);
  if (!command) return;

  // Enforce Primary Guild-only restriction for certain commands
  if (PRIMARY_ONLY_COMMANDS.includes(interaction.commandName) && interaction.guildId !== CONFIG.primaryGuildId) {
    return interaction.reply({
      content: "❌ This admin/onboarding command is strictly restricted to the **Primary Discord Guild** and cannot be run here.",
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    const replyMethod = interaction.deferred || interaction.replied ? "editReply" : "reply";
    await interaction[replyMethod]({
      content: `❌ An unexpected error occurred while executing this command: ${error.message || error}`,
      ephemeral: true
    }).catch(() => null);
  }
});

// Register all commands
import { assign } from "./commands/Admin/assign";
import { ban } from "./commands/Admin/ban";
import { unban } from "./commands/Admin/unban";
import { kick } from "./commands/Staff/kick";
import { mute } from "./commands/Staff/mute";
import { nickname } from "./commands/Staff/nickname";
import { say } from "./commands/Staff/say";
import { onboard } from "./commands/Staff/onboard";
import { warn } from "./commands/Staff/warn";
import { embedbuilder } from "./commands/Staff/embedbuilder";
import { patrolnotify } from "./commands/Staff/patrolnotify";
import { complaint } from "./commands/Member/complaint";
import { requestrole } from "./commands/Member/requestrole";
import { players } from "./commands/Member/players";
import { warnings } from "./commands/Member/warnings";

const allCmds = [assign, ban, unban, kick, mute, nickname, say, onboard, warn, embedbuilder, patrolnotify, complaint, requestrole, players, warnings];

for (const cmd of allCmds) {
  commandsCollection.set(cmd.data.name, cmd);
}

client.login(CONFIG.token);
