import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff, isAdmin, isLeadership } from "../../index";
import fs from "fs";
import { CONFIG } from "../../config";

export const ${cmd.name}: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("onboard")
    .setDescription("Gives players present roles and then the operator picks their department role.")${optionsBuilder},
  async execute(interaction) {
    ${category === "Staff" ? `if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }` : ""}
    ${category === "Admin" ? `if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: "❌ You require an **Admin or Leadership Role** to run this command.", ephemeral: true });
    }` : ""}
    ${category === "Leadership" ? `if (!isLeadership(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Community Manager or Community Leadership Role** to run this command.", ephemeral: true });
    }` : ""}
    ${executionBlock}
  }
};
