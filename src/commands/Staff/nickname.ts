import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";

export const nickname: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("nickname")
    .setDescription("Change the user's nickname across all guilds.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to rename").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("nickname").setDescription("The new nickname (leave blank to reset)").setRequired(false)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const newNickname = interaction.options.getString("nickname");

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const succeeded: string[] = [];
    const failedList: string[] = [];

    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) continue;
      try {
        await member.setNickname(newNickname, `Changed by ${interaction.user.tag}`);
        succeeded.push(guild.name);
      } catch {
        failedList.push(guild.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("✏️ Nickname Updated")
      .setColor(0x3498db)
      .setDescription(`${targetUser.tag}'s nickname was ${newNickname ? `set to **${newNickname}**` : "reset"}.`)
      .addFields(
        { name: "Updated in", value: succeeded.length ? succeeded.join(", ") : "Not found in any guild" },
        { name: "Failed in", value: failedList.length ? failedList.join(", ") : "None" }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
