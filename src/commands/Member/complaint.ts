import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "../../index";
import { CONFIG } from "../../config";

export const complaint: SlashCommand = {
  category: "Member",
  data: new SlashCommandBuilder()
    .setName("complaint")
    .setDescription("Get a list of all active department complaint and IA forms."),
  async execute(interaction) {
    const departmentNames = Object.keys(CONFIG.roles.departments);

    const embed = new EmbedBuilder()
      .setTitle("📋 Department Complaint & IA Forms")
      .setColor(0x3498db)
      .setDescription(
        departmentNames.length
          ? "Use the appropriate form below for your complaint or Internal Affairs report:"
          : "No department forms have been configured yet. Please contact a Community Leadership member."
      )
      .setTimestamp();

    if (departmentNames.length) {
      embed.addFields(
        departmentNames.map(dept => ({
          name: dept,
          value: `Contact a **${dept}** supervisor or Community Leadership to file a complaint/IA report for this department.`
        }))
      );
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
