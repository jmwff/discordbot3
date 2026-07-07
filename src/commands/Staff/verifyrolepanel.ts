import { SlashCommandBuilder, ChannelType, TextChannel } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { buildVerifyRolePanel } from "../../utils/roleSync";

export const verifyrolepanel: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("verifyrolepanel")
    .setDescription("Post the role verification panel in a channel.")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Channel to post the panel in")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const channel = interaction.options.getChannel("channel", true) as TextChannel;
    if (!("send" in channel)) {
      return interaction.reply({ content: "❌ I can't send a message to that channel.", ephemeral: true });
    }

    try {
      await channel.send(buildVerifyRolePanel());
    } catch {
      return interaction.reply({ content: "❌ I don't have permission to send messages in that channel.", ephemeral: true });
    }

    return interaction.reply({ content: `✅ Role verification panel posted in ${channel}.`, ephemeral: true });
  }
};
