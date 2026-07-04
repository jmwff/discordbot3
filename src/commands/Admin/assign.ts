import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand, isAdmin } from "../../index";

export const assign: SlashCommand = {
  category: "Admin",
  data: new SlashCommandBuilder()
    .setName("assign")
    .setDescription("Assign multiple roles to a user simultaneously.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user to assign roles to").setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName("role1").setDescription("Role to assign").setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName("role2").setDescription("Additional role to assign").setRequired(false)
    )
    .addRoleOption(opt =>
      opt.setName("role3").setDescription("Additional role to assign").setRequired(false)
    )
    .addRoleOption(opt =>
      opt.setName("role4").setDescription("Additional role to assign").setRequired(false)
    ),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: "❌ You require an **Admin or Leadership Role** to run this command.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("user", true);
    const roles = [
      interaction.options.getRole("role1"),
      interaction.options.getRole("role2"),
      interaction.options.getRole("role3"),
      interaction.options.getRole("role4"),
    ].filter((r): r is NonNullable<typeof r> => r !== null);

    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply({ content: "❌ Could not find that user in this server." });
    }

    const assigned: string[] = [];
    const failed: string[] = [];

    for (const role of roles) {
      try {
        await member.roles.add(role.id);
        assigned.push(role.name);
      } catch (err) {
        failed.push(role.name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Roles Assigned")
      .setColor(failed.length ? 0xf1c40f : 0x2ecc71)
      .setDescription(`Updated roles for ${targetUser}`)
      .addFields(
        { name: "✅ Assigned", value: assigned.length ? assigned.join(", ") : "None" },
        { name: "❌ Failed", value: failed.length ? failed.join(", ") : "None" }
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
