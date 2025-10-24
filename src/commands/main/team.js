/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Team = require("../../database/TeamSchema");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "team",
  description: "View your current team",
  async execute(message, args) {
    const userId = message.author.id;

    try {
      const team = await Team.findOne({ discordId: userId });
      if (!team || team.cards.length === 0) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Empty`)
          .setDescription(
            `
> ${general.emptyLine}
> You don't have any cards in your team!
> Use \`!teamadd <cardId>\` to add cards to your team.
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      let description = `> ${general.emptyLine}\n`;
      description += `> 🏀 **Team Overview**\n`;
      description += `> Progress: ${team.cards.length}/4 Players\n`;
      description += `> ${general.emptyLine}\n`;
      description += await formatTeamList(team.cards);
      description += `> ${general.emptyLine}`;

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${general.MyTEAM} ${message.author.username}'s Team`)
        .setDescription(description)
        .setFooter({
          text: "NBA Vault • Team Management",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in team command:", error);
      return message.reply("❌ There was an error viewing your team!");
    }
  },
};

function determineCardTier(cardId) {
  if (!cardId) throw new Error(`Invalid cardId: ${cardId}`);
  const id = String(cardId).trim();
  const idLower = id.toLowerCase();

  if (idLower.startsWith("40000")) return "darkMatter";
  if (idLower.startsWith("60000")) return "galaxyOpal";
  if (idLower.startsWith("50000")) return "pinkDiamond";
  if (idLower.startsWith("30000")) return "invincible";
  if (idLower.startsWith("20000") || idLower.startsWith("2000")) return "goats";
  if (idLower.startsWith("10000")) return "100ovr";
  if (idLower.startsWith("70000")) return "amethys";
  if (idLower.startsWith("80000")) return "ruby";
  if (idLower.startsWith("90000")) return "sapphire";
  if (idLower.startsWith("95000")) return "emerald";
  if (idLower.startsWith("boss")) return "bossBattles";
  if (
    idLower.includes("throwback") ||
    /\btb\d{2,4}\b/.test(idLower) ||
    idLower.includes("tb2k")
  )
    return "throwbacks";
  if (idLower.includes("goat")) return "goats";
  if (idLower.includes("invincible")) return "invincible";
  if (idLower.includes("100ovr")) return "100ovr";
  if (idLower.includes("dark") || idLower.includes("dark_matter"))
    return "darkMatter";
  if (idLower.includes("galaxy")) return "galaxyOpal";
  if (idLower.includes("pink")) return "pinkDiamond";
  if (idLower.includes("ameth")) return "amethys";
  if (idLower.includes("diamond")) return "diamond";
  if (idLower.includes("ruby")) return "ruby";
  if (idLower.includes("sapphire")) return "sapphire";
  if (idLower.includes("emerald")) return "emerald";

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
      const propertyName = getTierPropertyName(tier);
      const list = Array.isArray(config[propertyName])
        ? config[propertyName]
        : Object.values(config[propertyName] || {}).flat();
      if (list?.some((c) => String(c?.id || "").toLowerCase() === idLower)) {
        return tier;
      }
    } catch (error) {
      // ignore
      continue;
    }
  }

  throw new Error(`Could not determine tier for card ID: ${cardId}`);
}

function getTierPropertyName(tier) {
  switch (tier) {
    case "amethys":
      return "amethyst";
    case "throwbacks":
      return "throwback";
    case "bossBattles":
      return "bossBattles";
    case "100ovr":
      return "100ovr";
    default:
      return tier;
  }
}

async function formatTeamList(cardIds) {
  if (!cardIds || !cardIds.length) return "> *No cards in team*\n";

  let formattedList = "";
  for (const cardId of cardIds) {
    try {
      const cardTier = determineCardTier(cardId);
      const cardConfig = require(`../../configs/cards/${cardTier}.json`);
      const tierName = getTierPropertyName(cardTier);
      const list = Array.isArray(cardConfig[tierName])
        ? cardConfig[tierName]
        : Object.values(cardConfig[tierName] || {}).flat();
      const card = list?.find(
        (c) =>
          String(c?.id || "").toLowerCase() === String(cardId).toLowerCase()
      );

      if (card) {
        formattedList +=
          `> ${card.cardEmoji || "🏀"} **${card.name}** (` +
          "`" +
          `${card.id}` +
          "`" +
          `)\n`;
        continue;
      }

      let foundCard = null;
      const fallbackTiers = [
        "darkMatter",
        "goats",
        "100ovr",
        "invincible",
        "galaxyOpal",
        "pinkDiamond",
        "diamond",
        "amethyst",
        "ruby",
        "sapphire",
        "emerald",
        "throwbacks",
      ];

      const searchId = String(cardId).toLowerCase();
      for (const tier of fallbackTiers) {
        try {
          const cfg = require(`../../configs/cards/${tier}.json`);
          const prop = getTierPropertyName(tier);
          const arr = Array.isArray(cfg[prop])
            ? cfg[prop]
            : Object.values(cfg[prop] || {}).flat();
          const found = arr?.find(
            (c) => String(c?.id || "").toLowerCase() === searchId
          );
          if (found) {
            foundCard = found;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (foundCard) {
        formattedList +=
          `> ${foundCard.cardEmoji || "🏀"} **${foundCard.name}** (` +
          "`" +
          `${foundCard.id}` +
          "`" +
          `)\n`;
      } else {
        formattedList +=
          `> ❌ Card not found (` + "`" + `${cardId}` + "`" + `)\n`;
      }
    } catch (error) {
      console.error(`Error formatting card ${cardId}:`, error);
      formattedList +=
        `> ❌ Error displaying card (` + "`" + `${cardId}` + "`" + `)\n`;
    }
  }
  return formattedList;
}
