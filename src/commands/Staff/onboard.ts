import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { CONFIG } from "../../config";

const departmentEntries = Object.entries(CONFIG.roles.departments);

export const onboard: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("onboard")
    .setDescription("Gives players present roles and then the operator picks their department role.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to onboard").setRequired(true)
    )
    .addStringOption(opt => {
      opt.setName("department").setDescription("The department to assign").setRequired(true);
      for (const [name] of departmentEntries) {
        opt.addChoices({ name, value: name });
      }
      return opt;
    }),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const department = interaction.options.getString("department", true);
    const departmentRoleId = CONFIG.roles.departments[department];

    if (!departmentRoleId) {
      return interaction.reply({ content: "❌ That department is not configured on this server.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply({ content: "❌ Could not find that user in this server." });
    }

    try {
      await member.roles.add(CONFIG.roles.member);
      await member.roles.add(departmentRoleId);
    } catch {
      return interaction.editReply({ content: "❌ I couldn't assign roles to that user. Check my role position and permissions." });
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ Member Onboarded")
      .setColor(0x2ecc71)
      .setDescription(`${targetUser} has been given the **Member** role and assigned to **${department}**.`)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
