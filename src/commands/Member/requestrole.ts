import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "../../index";
import { CONFIG } from "../../config";

const departmentEntries = Object.entries(CONFIG.roles.departments);

export const requestrole: SlashCommand = {
  category: "Member",
  data: new SlashCommandBuilder()
    .setName("requestrole")
    .setDescription("Request to add or remove roles/departments from a user.")
    .addStringOption(opt =>
      opt
        .setName("action")
        .setDescription("Whether to add or remove the department role")
        .setRequired(true)
        .addChoices(
          { name: "Add", value: "add" },
          { name: "Remove", value: "remove" }
        )
    )
    .addStringOption(opt => {
      opt.setName("department").setDescription("The department to request").setRequired(true);
      for (const [name] of departmentEntries) {
        opt.addChoices({ name, value: name });
      }
      return opt;
    }),
  async execute(interaction) {
    const action = interaction.options.getString("action", true);
    const department = interaction.options.getString("department", true);

    const roleId = CONFIG.roles.departments[department];
    if (!roleId) {
      return interaction.reply({ content: "❌ That department is not configured on this server.", ephemeral: true });
    }

    const member = interaction.member as import("discord.js").GuildMember | null;
    if (!member) {
      return interaction.reply({ content: "❌ This command can only be used inside a server.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      if (action === "add") {
        await member.roles.add(roleId);
      } else {
        await member.roles.remove(roleId);
      }
    } catch {
      return interaction.editReply({ content: `❌ I couldn't ${action} the **${department}** role. Please contact staff for help.` });
    }

    const embed = new EmbedBuilder()
      .setTitle("Role Request Processed")
      .setColor(action === "add" ? 0x2ecc71 : 0xe67e22)
      .setDescription(`${action === "add" ? "Added" : "Removed"} the **${department}** department role for ${interaction.user}.`)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
