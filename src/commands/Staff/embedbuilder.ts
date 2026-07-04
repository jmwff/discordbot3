import { SlashCommandBuilder, EmbedBuilder, ChannelType, TextChannel } from "discord.js";
import { SlashCommand, isLeadership } from "../../index";

export const embedbuilder: SlashCommand = {
  // NOTE: category is set to "Leadership" (not "Staff") so this command is
  // gated by isLeadership() below, per the request to restrict embedbuilder
  // to Community Manager / Community Leadership only.
  category: "Leadership",
  data: new SlashCommandBuilder()
    .setName("embedbuilder")
    .setDescription("Allows a user to create custom embeds with the bot.")
    .addStringOption(opt =>
      opt.setName("title").setDescription("The embed title").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("description").setDescription("The embed body text").setRequired(true)
    )
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Channel to send the embed to (defaults to this channel)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("color").setDescription("Hex color, e.g. #5865F2").setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("image").setDescription("Image URL to attach").setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("footer").setDescription("Footer text").setRequired(false)
    ),
  async execute(interaction) {
    if (!isLeadership(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Community Manager or Community Leadership Role** to run this command.", ephemeral: true });
    }

    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const channelOption = interaction.options.getChannel("channel") as TextChannel | null;
    const colorInput = interaction.options.getString("color");
    const image = interaction.options.getString("image");
    const footer = interaction.options.getString("footer");

    let color = 0x5865f2;
    if (colorInput) {
      const parsed = parseInt(colorInput.replace("#", ""), 16);
      if (!Number.isNaN(parsed)) color = parsed;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (image) embed.setImage(image);
    if (footer) embed.setFooter({ text: footer });

    const targetChannel = channelOption ?? (interaction.channel as TextChannel | null);
    if (!targetChannel || !("send" in targetChannel)) {
      return interaction.reply({ content: "❌ I can't send an embed to that channel.", ephemeral: true });
    }

    try {
      await targetChannel.send({ embeds: [embed] });
    } catch {
      return interaction.reply({ content: "❌ I don't have permission to send messages in that channel.", ephemeral: true });
    }

    return interaction.reply({ content: `✅ Embed sent to ${targetChannel}.`, ephemeral: true });
  }
};
