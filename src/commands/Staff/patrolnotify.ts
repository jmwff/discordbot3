import { SlashCommandBuilder, EmbedBuilder, TextChannel } from "discord.js";
import { SlashCommand, isStaff } from "../../index";
import { CONFIG } from "../../config";

const PATROL_NOTIFY_CHANNEL_ID = "1518419485311369286";

export const patrolnotify: SlashCommand = {
  category: "Staff",
  data: new SlashCommandBuilder()
    .setName("patrolnotify")
    .setDescription("Send a patrol notification embed and ping the Patrol Notified role.")
    .addStringOption(opt =>
      opt.setName("date").setDescription("Patrol date, e.g. 6/29/2026").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("time").setDescription("Patrol time, e.g. 5:00pm EST").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("area").setDescription("Area of patrol, e.g. South Houston Texas").setRequired(true)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "❌ You require a **Staff, Admin, or Leadership Role** to run this command.", ephemeral: true });
    }

    const date = interaction.options.getString("date", true);
    const time = interaction.options.getString("time", true);
    const area = interaction.options.getString("area", true);

    const channelOption = await interaction.client.channels.fetch(PATROL_NOTIFY_CHANNEL_ID).catch(() => null) as TextChannel | null;

    if (!channelOption || !("send" in channelOption)) {
      return interaction.reply({ content: "❌ I can't send a message to the configured patrol notification channel.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🚨 The East Bay Project Roleplay Patrol Notification")
      .setColor(0x3498db)
      .setDescription(
        "Attention members of The East Bay Project Roleplay! We are hosting a patrol. Below you'll find the required information. If you encounter any bugs, please report them in the bug reports channel."
      )
      .addFields(
        {
          name: "Patrol Details",
          value: `**Patrol Date:** ${date}\n**Patrol Time:** ${time}\n**Area of Patrol:** ${area}`
        },
        {
          name: "Connection Details",
          value: `**Production Server:** connect dg334yj`
        }
      )
      .setFooter({ text: "The East Bay Project Roleplay" })
      .setTimestamp();

    try {
      await channelOption.send({
        content: `<@&${CONFIG.roles.patrolnotified}>`,
        embeds: [embed]
      });
    } catch {
      return interaction.reply({ content: "❌ I don't have permission to send messages in that channel.", ephemeral: true });
    }

    return interaction.reply({ content: `✅ Patrol notification sent to ${channelOption}.`, ephemeral: true });
  }
};
