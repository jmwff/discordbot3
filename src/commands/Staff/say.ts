import { SlashCommandBuilder, ChannelType, TextChannel } from "discord.js";
import { SlashCommand, isStaff } from "../../index";

export const say: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send a message as the bot.")
    .addStringOption(opt =>
      opt.setName("message").setDescription("The message to send").setRequired(true)
    )
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Channel to send to (defaults to this channel)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const message = interaction.options.getString("message", true);
    const channelOption = interaction.options.getChannel("channel") as TextChannel | null;
    const targetChannel = channelOption ?? (interaction.channel as TextChannel | null);

    if (!targetChannel || !("send" in targetChannel)) {
      return interaction.reply({ content: "❌ I can't send a message to that channel.", ephemeral: true });
    }

    try {
      await targetChannel.send({ content: message });
    } catch {
      return interaction.reply({ content: "❌ I don't have permission to send messages in that channel.", ephemeral: true });
    }

    return interaction.reply({ content: `✅ Message sent to ${targetChannel}.`, ephemeral: true });
  }
};
