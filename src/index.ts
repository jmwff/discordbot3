import { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActivityType, TextChannel } from "discord.js";
import fs from "fs";
import path from "path";
import { CONFIG } from "./config";
import {
  ATTEND_BUTTON_ID,
  NOT_ATTEND_BUTTON_ID,
  parseAttendingIds,
  buildAttendanceFieldValue,
  buildAttendanceRow
} from "./utils/attendanceStore";
import {
  VERIFY_ROLE_BUTTON_ID,
  computeDesiredFanRoles,
  MANAGED_FAN_ROLE_IDS,
  buildVerifyRolePanel,
  VERIFY_ROLE_PANEL_TITLE
} from "./utils/roleSync";

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

const VERIFY_ROLE_PANEL_CHANNEL_ID = "1522269141615120435";

// Bot status rotation — edit this list to change what cycles through.
const STATUS_ROTATION: { name: string; type: ActivityType }[] = [
  { name: "The East Bay | /status", type: ActivityType.Playing },
  { name: "over East Bay Roleplay", type: ActivityType.Watching },
  { name: "/players for server pop", type: ActivityType.Listening },
  { name: "the streets of San Andreas", type: ActivityType.Playing }
];
const STATUS_ROTATION_INTERVAL_MS = 15_000;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!\nGuilds initialized: ${CONFIG.allowedGuilds.length}`);

  let statusIndex = 0;
  const applyNextStatus = () => {
    const status = STATUS_ROTATION[statusIndex % STATUS_ROTATION.length];
    client.user?.setActivity(status.name, { type: status.type });
    statusIndex++;
  };
  applyNextStatus();
  setInterval(applyNextStatus, STATUS_ROTATION_INTERVAL_MS);

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

  // Auto-post the Verify Role panel on startup, but only if it isn't already there
  try {
    const panelChannel = (await client.channels.fetch(VERIFY_ROLE_PANEL_CHANNEL_ID).catch(() => null)) as TextChannel | null;
    if (panelChannel && "send" in panelChannel && "messages" in panelChannel) {
      const recentMessages = await panelChannel.messages.fetch({ limit: 50 }).catch(() => null);
      const alreadyPosted = recentMessages?.some(
        m => m.author.id === client.user?.id && m.embeds[0]?.title === VERIFY_ROLE_PANEL_TITLE
      );

      if (!alreadyPosted) {
        await panelChannel.send(buildVerifyRolePanel());
        console.log(`Posted Verify Role panel in channel ${VERIFY_ROLE_PANEL_CHANNEL_ID}.`);
      } else {
        console.log("Verify Role panel already present — skipping repost.");
      }
    } else {
      console.error(`Could not find or send to Verify Role panel channel ${VERIFY_ROLE_PANEL_CHANNEL_ID}.`);
    }
  } catch (error) {
    console.error("Error auto-posting Verify Role panel:", error);
  }
});

// Auto-assign the Unverified role to new members when they join
client.on("guildMemberAdd", async (member) => {
  if (!CONFIG.roles.unverified) return;
  try {
    await member.roles.add(CONFIG.roles.unverified);
    console.log(`Assigned Unverified role to ${member.user.tag} in ${member.guild.name}`);
  } catch (error) {
    console.error(`Failed to assign Unverified role to ${member.user.tag} in ${member.guild.name}:`, error);
  }
});

// Interaction routing
client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("embedbuilder_modal_")) {
      const channelId = interaction.customId.replace("embedbuilder_modal_", "");
      try {
        const channel = (await interaction.client.channels.fetch(channelId).catch(() => null)) as TextChannel | null;
        if (!channel || !("send" in channel)) {
          return interaction.reply({ content: "❌ I can't send an embed to that channel.", ephemeral: true });
        }

        const title = interaction.fields.getTextInputValue("title");
        const description = interaction.fields.getTextInputValue("description");
        const colorInput = interaction.fields.getTextInputValue("color");
        const image = interaction.fields.getTextInputValue("image");
        const footer = interaction.fields.getTextInputValue("footer");

        let color = 0x5865f2;
        if (colorInput) {
          const parsed = parseInt(colorInput.replace("#", ""), 16);
          if (!Number.isNaN(parsed)) color = parsed;
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setTimestamp();

        if (image) embed.setThumbnail(image);
        if (footer) embed.setFooter({ text: footer });

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Embed sent to ${channel}.`, ephemeral: true });
      } catch (error) {
        console.error("Error handling embedbuilder modal submission:", error);
        await interaction.reply({ content: "❌ Something went wrong sending that embed.", ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === VERIFY_ROLE_BUTTON_ID) {
      try {
        const mainGuild = interaction.client.guilds.cache.get(CONFIG.primaryGuildId);
        if (!mainGuild) {
          return interaction.reply({ content: "❌ I couldn't find the main East Bay Project Roleplay server. Contact an admin.", ephemeral: true });
        }

        const mainMember = await mainGuild.members.fetch(interaction.user.id).catch(() => null);
        if (!mainMember) {
          return interaction.reply({
            content: "❌ You need to be a member of the main East Bay Project Roleplay Discord to verify your role. Join there first, then try again.",
            ephemeral: true
          });
        }

        const mainRoleIds = mainMember.roles.cache.map(r => r.id);
        const desiredFanRoles = computeDesiredFanRoles(mainRoleIds);

        const fanMember = interaction.member as import("discord.js").GuildMember;
        const currentManagedRoles = fanMember.roles.cache
          .filter(r => MANAGED_FAN_ROLE_IDS.includes(r.id))
          .map(r => r.id);

        const rolesToAdd = desiredFanRoles.filter(id => !currentManagedRoles.includes(id));
        const rolesToRemove = currentManagedRoles.filter(id => !desiredFanRoles.includes(id));

        if (rolesToAdd.length) await fanMember.roles.add(rolesToAdd);
        if (rolesToRemove.length) await fanMember.roles.remove(rolesToRemove);

        if (!rolesToAdd.length && !rolesToRemove.length) {
          return interaction.reply({
            content: desiredFanRoles.length
              ? "✅ Your roles are already up to date."
              : "⚠️ No matching department or staff roles were found on your main server account.",
            ephemeral: true
          });
        }

        return interaction.reply({ content: "✅ Your roles have been updated to match the main server.", ephemeral: true });
      } catch (error) {
        console.error("Error handling verify role button:", error);
        await interaction.reply({ content: "❌ Something went wrong verifying your role. Please contact staff.", ephemeral: true }).catch(() => null);
      }
      return;
    }

    if (interaction.customId === ATTEND_BUTTON_ID || interaction.customId === NOT_ATTEND_BUTTON_ID) {
      try {
        const sourceEmbed = interaction.message.embeds[0];
        const attendingField = sourceEmbed.fields.find(f => f.name.startsWith("Members Attending"));
        let ids = attendingField ? parseAttendingIds(attendingField.value) : [];

        if (interaction.customId === ATTEND_BUTTON_ID) {
          if (!ids.includes(interaction.user.id)) ids.push(interaction.user.id);
        } else {
          ids = ids.filter(id => id !== interaction.user.id);
        }

        const value = buildAttendanceFieldValue(ids);
        const updatedFields = sourceEmbed.fields.map(f =>
          f.name.startsWith("Members Attending")
            ? { name: `Members Attending (${ids.length})`, value, inline: f.inline }
            : { name: f.name, value: f.value, inline: f.inline }
        );

        const updatedEmbed = EmbedBuilder.from(sourceEmbed).setFields(updatedFields);

        await interaction.update({ embeds: [updatedEmbed], components: [buildAttendanceRow()] });
      } catch (error) {
        console.error("Error handling patrol attendance button:", error);
        await interaction.reply({ content: "❌ Something went wrong updating your attendance.", ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

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
import { verifyrolepanel } from "./commands/Staff/verifyrolepanel";
import { complaint } from "./commands/Member/complaint";
import { requestrole } from "./commands/Member/requestrole";
import { players } from "./commands/Member/players";
import { warnings } from "./commands/Member/warnings";

const allCmds = [assign, ban, unban, kick, mute, nickname, say, onboard, warn, embedbuilder, patrolnotify, verifyrolepanel, complaint, requestrole, players, warnings];

for (const cmd of allCmds) {
  commandsCollection.set(cmd.data.name, cmd);
}

client.login(CONFIG.token);
