/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const Team = require("../../database/TeamSchema");
const crypto = require("crypto");

function loadCardById(cardId) {
  const id = String(cardId).toLowerCase();
  const tiers = [
    "100ovr",
    "galaxyOpal",
    "pinkDiamond",
    "diamond",
    "amethys",
    "throwbacks",
    "ruby",
    "sapphire",
    "emerald",
    "bossBattles",
    "invincible",
    "goats",
    "darkMatter",
  ];

  for (const tier of tiers) {
    try {
      const config = require(`../../configs/cards/${tier}.json`);
      const key =
        tier === "amethys"
          ? "amethyst"
          : tier === "throwbacks"
          ? "throwback"
          : tier;
      const cards = config[key];
      if (cards) {
        const card = cards.find((c) => String(c.id).toLowerCase() === id);
        if (card) return card;
      }
    } catch (e) {
      continue;
    }
  }
  return { name: cardId, position: "Unknown", overall: 0 };
}

function generateSecureHash(userId, data) {
  const hash = crypto.createHash("sha256");
  hash.update(userId + JSON.stringify(data));
  return hash.digest("base64");
}

function convertToCSV(cardIds) {
  const header = "id,name,position,overall\n";
  const rows = cardIds
    .map((id) => {
      const card = loadCardById(id);
      return `${id},${card.name},${card.position},${card.overall || 0}`;
    })
    .join("\n");
  return header + rows;
}

module.exports = {
  name: "teamexport",
  description: "Export your active team as JSON or CSV",
  async execute(message, args) {
    try {
      const userId = message.author.id;
      const team = await Team.findOne({ discordId: userId });

      if (!team || !team.cards || team.cards.length === 0) {
        return message.reply("You don't have any cards in your active team!");
      }

      const format = args[0]?.toLowerCase() || "json";
      if (format !== "json" && format !== "csv") {
        return message.reply("Invalid format! Use !teamexport <json/csv>");
      }

      const teamData =
        format === "json" ? team.cards : convertToCSV(team.cards);
      const hash = generateSecureHash(userId, teamData);
      const exportData = {
        hash,
        data: teamData,
        userId,
      };

      const encoded = Buffer.from(JSON.stringify(exportData)).toString(
        "base64"
      );

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Team Export")
        .setDescription(
          `Here's your team export code. Use !teamimport with this code to import your team later.\n\`\`\`\n${encoded}\n\`\`\``
        )
        .setFooter({
          text: `NBA Vault • Team Export • ${format.toUpperCase()}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error exporting your team!");
    }
  },
};
