import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { getWarnings } from "../../utils/warningsStore";

export const warnings: SlashCommand = {
  category: "Member",
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Check a member's warnings or view your own disciplinary history.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to check (staff only — defaults to yourself)").setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");

    if (targetUser && targetUser.id !== interaction.user.id && !isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to check another user's warnings.", ephemeral: true });
    }

    const lookupUser = targetUser ?? interaction.user;
    const records = getWarnings(lookupUser.id);

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${lookupUser.tag}`)
      .setColor(records.length ? 0xf1c40f : 0x2ecc71)
      .setDescription(records.length ? `Total warnings: **${records.length}**` : "No warnings on record.")
      .setTimestamp();

    if (records.length) {
      embed.addFields(
        records.slice(-10).map((r, i) => ({
          name: `#${records.length - Math.min(10, records.length) + i + 1} — ${new Date(r.timestamp).toLocaleDateString()}`,
          value: `**Reason:** ${r.reason}\n**Issued by:** <@${r.moderatorId}>`
        }))
      );
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
