import { Client, EmbedBuilder, TextChannel } from "discord.js";

export async function sendLog(client: Client, channelId: string, embed: EmbedBuilder): Promise<void> {
  if (!channelId) return;
  try {
    const channel = (await client.channels.fetch(channelId).catch(() => null)) as TextChannel | null;
    if (channel && "send" in channel) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`Failed to send log to channel ${channelId}:`, error);
  }
}
