import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isAdmin } from "../../index";
import { CONFIG } from "../../config";
import { sendLog } from "../../utils/logger";

export const unban: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from all discords/guilds the bot is in.")
    .addStringOption(opt =>
      opt.setName("userid").setDescription("The Discord user ID to unban").setRequired(true)
    ),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: "❌ You require an **Admin or Leadership Role** to run this command.", ephemeral: true });
    }

    const userId = interaction.options.getString("userid", true).trim();

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ content: "❌ That doesn't look like a valid Discord user ID.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const succeeded: string[] = [];
    const failedList: string[] = [];

    for (const [, guild] of client.guilds.cache) {
      try {
        await guild.bans.remove(userId, `Unbanned by ${interaction.user.tag}`);
        succeeded.push(guild.name);
      } catch {
        failedList.push(guild.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ User Unbanned")
      .setColor(0x2ecc71)
      .setDescription(`<@${userId}> (${userId}) has been unbanned where applicable.`)
      .addFields(
        { name: "Unbanned in", value: succeeded.length ? succeeded.join(", ") : "None" },
        { name: "Failed / not banned in", value: failedList.length ? failedList.join(", ") : "None" }
      )
      .setTimestamp();

    const logEmbed = EmbedBuilder.from(embed).addFields({ name: "Executed by", value: `${interaction.user.tag} (${interaction.user.id})` });
    await sendLog(client, CONFIG.logChannels.unban, logEmbed);

    return interaction.editReply({ embeds: [embed] });
  }
};
