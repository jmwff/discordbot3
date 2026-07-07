import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "../../index";
import { CONFIG } from "../../config";

interface FivemPlayer {
  id: number;
  name: string;
  ping: number;
  identifiers: string[];
}

export const players: SlashCommand = {
  category: "Member",
  data: new SlashCommandBuilder()
    .setName("players")
    .setDescription("Shows the amount of players in game, their names, ingame ID and discord ID."),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch(`http://${CONFIG.playersServiceIp}/players.json`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as FivemPlayer[];

      if (!Array.isArray(data) || data.length === 0) {
        const empty = new EmbedBuilder()
          .setTitle("🎮 Server Players")
          .setColor(0x95a5a6)
          .setDescription("No players are currently online.")
          .setTimestamp();
        return interaction.editReply({ embeds: [empty] });
      }

      const lines = data.slice(0, 25).map(p => {
        const discordId = p.identifiers?.find(id => id.startsWith("discord:"))?.split(":")[1];
        return `**#${p.id}** — ${p.name}${discordId ? ` (<@${discordId}>)` : ""}`;
      });

      const embed = new EmbedBuilder()
        .setTitle("🎮 Server Players")
        .setColor(0x2ecc71)
        .setDescription(`**${data.length}** player(s) currently online:\n\n${lines.join("\n")}`)
        .setFooter({ text: data.length > 25 ? `Showing first 25 of ${data.length} players` : CONFIG.serverName })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Unable to Reach Server")
        .setColor(0xe67e22)
        .setDescription("Could not fetch the player list right now. The server may be offline or unreachable.")
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  }
};