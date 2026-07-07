import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000; // Discord's 28-day timeout cap

function parseDuration(input: string): number | null {
  const match = input.trim().match(/^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("m")) return amount * 60 * 1000;
  if (unit.startsWith("h")) return amount * 60 * 60 * 1000;
  if (unit.startsWith("d")) return amount * 24 * 60 * 60 * 1000;
  return null;
}

export const mute: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user for a specified time across all discords the bot is in.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to mute").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("duration").setDescription("Duration, e.g. 10m, 1h, 1d (max 28d)").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for the mute").setRequired(false)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const durationInput = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const durationMs = parseDuration(durationInput);
    if (!durationMs) {
      return interaction.reply({ content: "❌ Invalid duration. Use a format like `10m`, `1h`, or `1d`.", ephemeral: true });
    }
    const clampedMs = Math.min(durationMs, MAX_TIMEOUT_MS);

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const succeeded: string[] = [];
    const failedList: string[] = [];

    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) continue;
      try {
        await member.timeout(clampedMs, `${reason} (by ${interaction.user.tag})`);
        succeeded.push(guild.name);
      } catch {
        failedList.push(guild.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🔇 User Muted")
      .setColor(0xf1c40f)
      .setDescription(`${targetUser.tag} (${targetUser.id}) has been muted for **${durationInput}**.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Muted in", value: succeeded.length ? succeeded.join(", ") : "Not found in any guild" },
        { name: "Failed in", value: failedList.length ? failedList.join(", ") : "None" }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
