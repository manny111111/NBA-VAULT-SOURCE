/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Get the Top.gg voting link for the bot"),
  async execute(interaction) {
    try {
      const topggVoteUrl = "https://top.gg/bot/1414433675613048832/vote";

      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle(`${general?.MyTEAM || "NBA Vault"} - Vote`)
        .setDescription(
          `Click the button below to vote for the bot on Top.gg to support its development and help it grow!`
        )
        .setFooter({ text: "Thank you for supporting the bot!" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Vote on Top.gg")
          .setStyle(ButtonStyle.Link)
          .setURL(topggVoteUrl)
      );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in /vote command:", error);
      if (!interaction.replied)
        await interaction.reply({
          content: "There was an error processing your request.",
          ephemeral: true,
        });
    }
  },
};
