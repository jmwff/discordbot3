import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { addWarning, getWarnings } from "../../utils/warningsStore";

export const warn: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issues a formal warning to a specified player.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to warn").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for the warning").setRequired(true)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const record = addWarning(targetUser.id, interaction.user.id, reason);
    const totalWarnings = getWarnings(targetUser.id).length;

    // Best-effort DM to the warned user; don't fail the command if their DMs are closed.
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ You Have Received a Warning")
          .setColor(0xf1c40f)
          .setDescription(`You were warned in **${interaction.guild?.name ?? "the server"}**.`)
          .addFields({ name: "Reason", value: reason })
          .setTimestamp(record.timestamp)
      ]
    }).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Warning Issued")
      .setColor(0xf1c40f)
      .setDescription(`${targetUser} has been warned.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Issued by", value: `${interaction.user}` },
        { name: "Total warnings", value: `${totalWarnings}` }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
