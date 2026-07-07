import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { CONFIG } from "../../config";
import { sendLog } from "../../utils/logger";

export const kick: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user across all discords/guilds the bot is in.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to kick").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for the kick").setRequired(false)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const succeeded: string[] = [];
    const failedList: string[] = [];

    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) continue;
      try {
        await member.kick(`${reason} (by ${interaction.user.tag})`);
        succeeded.push(guild.name);
      } catch {
        failedList.push(guild.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("👢 User Kicked")
      .setColor(0xe67e22)
      .setDescription(`${targetUser.tag} (${targetUser.id}) has been kicked.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Kicked from", value: succeeded.length ? succeeded.join(", ") : "Not found in any guild" },
        { name: "Failed in", value: failedList.length ? failedList.join(", ") : "None" }
      )
      .setTimestamp();

    const logEmbed = EmbedBuilder.from(embed).addFields({ name: "Executed by", value: `${interaction.user.tag} (${interaction.user.id})` });
    await sendLog(client, CONFIG.logChannels.kick, logEmbed);

    return interaction.editReply({ embeds: [embed] });
  }
};
