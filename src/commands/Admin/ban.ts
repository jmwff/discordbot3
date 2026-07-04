import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isAdmin } from "../../index";
import { CONFIG } from "../../config";
import { sendLog } from "../../utils/logger";

export const ban: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user across all discords/guilds the bot is in.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for the ban").setRequired(false)
    ),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: "❌ You require an **Admin or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const succeeded: string[] = [];
    const failedList: string[] = [];

    for (const [, guild] of client.guilds.cache) {
      try {
        await guild.bans.create(targetUser.id, { reason: `${reason} (by ${interaction.user.tag})` });
        succeeded.push(guild.name);
      } catch {
        failedList.push(guild.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🔨 User Banned")
      .setColor(0xe74c3c)
      .setDescription(`${targetUser.tag} (${targetUser.id}) has been banned.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Banned in", value: succeeded.length ? succeeded.join(", ") : "None" },
        { name: "Failed in", value: failedList.length ? failedList.join(", ") : "None" }
      )
      .setTimestamp();

    const logEmbed = EmbedBuilder.from(embed).addFields({ name: "Executed by", value: `${interaction.user.tag} (${interaction.user.id})` });
    await sendLog(client, CONFIG.logChannels.ban, logEmbed);

    return interaction.editReply({ embeds: [embed] });
  }
};
