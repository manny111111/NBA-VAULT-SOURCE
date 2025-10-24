/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const Team = require("../../database/TeamSchema");
const User = require("../../database/UserSchema");
const crypto = require("crypto");

function generateSecureHash(userId, data) {
  const hash = crypto.createHash("sha256");
  hash.update(userId + JSON.stringify(data));
  return hash.digest("base64");
}

function validateTeamData(data) {
  if (Array.isArray(data)) return data.every((id) => typeof id === "string");
  return false;
}

module.exports = {
  name: "teamimport",
  description: "Import a previously exported team using the export code",
  async execute(message, args) {
    try {
      if (!args[0]) {
        return message.reply(
          "Please provide the export code. Usage: !teamimport <code>"
        );
      }

      const userId = message.author.id;
      const user = await User.findOne({ discordId: userId });

      if (!user) {
        return message.reply(
          "You need to create an account first. Use !daily to start!"
        );
      }

      let exportData;
      try {
        const decoded = Buffer.from(args[0], "base64").toString();
        exportData = JSON.parse(decoded);
      } catch (e) {
        return message.reply("Invalid export code!");
      }

      if (exportData.userId !== userId) {
        return message.reply("This team export belongs to another user!");
      }

      const verifyHash = generateSecureHash(userId, exportData.data);
      if (verifyHash !== exportData.hash) {
        return message.reply("Invalid or tampered export code!");
      }

      let teamData;
      try {
        teamData =
          typeof exportData.data === "string" && exportData.data.includes(",")
            ? exportData.data
                .split("\n")
                .slice(1)
                .map((row) => row.split(",")[0])
            : exportData.data;
      } catch (e) {
        return message.reply("Error parsing team data!");
      }

      if (!validateTeamData(teamData)) {
        return message.reply("Invalid team data format!");
      }

      const ownedCardIds = new Set(user.cards);
      if (!teamData.every((cardId) => ownedCardIds.has(cardId))) {
        return message.reply("You don't own all the cards in this team!");
      }

      let team = await Team.findOne({ discordId: userId });
      if (!team) {
        team = new Team({ discordId: userId, cards: [] });
      }
      team.cards = teamData;
      await team.save();

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Team Import Successful")
        .setDescription(
          `Successfully imported ${teamData.length} cards to your active team!`
        )
        .setFooter({
          text: "NBA Vault • Team Import",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error importing your team!");
    }
  },
};
