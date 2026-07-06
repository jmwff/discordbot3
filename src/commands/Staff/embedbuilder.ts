import {
  SlashCommandBuilder,
  ChannelType,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from "discord.js";
import { SlashCommand, isLeadership } from "../../index";

export const embedbuilder: SlashCommand = {
  // NOTE: category is set to "Leadership" (not "Staff") so this command is
  // gated by isLeadership() below, restricting it to Community Manager /
  // Community Leadership only.
  category: "Leadership",
  data: new SlashCommandBuilder()
    .setName("embedbuilder")
    .setDescription("Opens a form to build and send a custom embed.")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("Channel to send the embed to (defaults to this channel)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    if (!isLeadership(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Community Manager or Community Leadership Role** to run this command.", ephemeral: true });
    }

    const channelOption = (interaction.options.getChannel("channel") as TextChannel | null) ?? (interaction.channel as TextChannel | null);
    if (!channelOption || !("send" in channelOption)) {
      return interaction.reply({ content: "❌ I can't send an embed to that channel.", ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`embedbuilder_modal_${channelOption.id}`)
      .setTitle("Create Embed");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Title")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(256)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(4000)
      .setRequired(true);

    const colorInput = new TextInputBuilder()
      .setCustomId("color")
      .setLabel("Color (hex, e.g. #5865F2)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const imageInput = new TextInputBuilder()
      .setCustomId("image")
      .setLabel("Thumbnail image URL (top-right corner)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId("footer")
      .setLabel("Footer text")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput)
    );

    await interaction.showModal(modal);
  }
};
