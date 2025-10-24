/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Team = require("../../database/TeamSchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "teamremove",
  description: "Remove a card from your team",
  aliases: ["tr"],
  usage: "!teamremove <cardId>",
  async execute(message, args) {
    try {
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> Please provide a card ID or 'all' to remove from your team
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const rawArg = args[0].trim();

      if (rawArg.toLowerCase() === "all") {
        const team = await Team.findOne({ discordId: message.author.id });
        if (!team || !team.cards || team.cards.length === 0) {
          return message.reply(
            "You don't have any cards in your team to remove!"
          );
        }

        const oldCount = team.cards.length;
        team.cards = [];
        await team.save();

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> ✅ Successfully removed all ${oldCount} cards from your team
> ${general.emptyLine}
> Current Team (0/4):
> *No cards in team*
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
      const cardIdLower = rawArg.toLowerCase();
      const discordId = message.author.id;

      const team = await Team.findOne({ discordId });

      const storedId =
        team?.cards?.find((c) => String(c).toLowerCase() === cardIdLower) ||
        null;

      let resolvedStoredId = storedId;
      if (!resolvedStoredId) {
        const resolved = getCardInfo(rawArg) || getCardInfo(cardIdLower);
        if (resolved && resolved.id) {
          resolvedStoredId =
            team?.cards?.find(
              (c) =>
                String(c).toLowerCase() === String(resolved.id).toLowerCase()
            ) || null;
        }
      }

      if (!team || !resolvedStoredId) {
        const card = getCardInfo(rawArg) || getCardInfo(cardIdLower);
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> ❌ ${
              card
                ? `${card.cardEmoji} **${card.name}**`
                : `This card (\`${rawArg}\`)`
            } is not in your team!
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const card = getCardInfo(resolvedStoredId) || getCardInfo(rawArg);
      team.cards = team.cards.filter(
        (id) =>
          String(id).toLowerCase() !== String(resolvedStoredId).toLowerCase()
      );
      await team.save();

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(`${general.MyTEAM} Team Management`)
        .setDescription(
          `
> ${general.emptyLine}
> ✅ ${
            card
              ? `${card.cardEmoji} **${card.name}**`
              : `Card \`${resolvedStoredId}\``
          } has been removed from your team
> ${general.emptyLine}
> Current Team (${team.cards.length}/4):
${await formatTeamList(team.cards)}
> ${general.emptyLine}`
        )
        .setFooter({
          text: "NBA Vault • Team Management",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in teamremove command:", error);
      return message.reply(
        "❌ There was an error removing the card from your team!"
      );
    }
  },
};

function getCardInfo(cardId) {
  try {
    const cardTier = determineCardTier(cardId);
    const cardConfig = require(`../../configs/cards/${cardTier}.json`);
    const tierName = getTierPropertyName(cardTier);
    const card = cardConfig[tierName]?.find(
      (c) => c.id.toLowerCase() === String(cardId).toLowerCase()
    );
    if (card) return card;
  } catch (error) {
    console.error(`Error in direct lookup for ${cardId}:`, error);
  }

  const tiers = [
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
  for (const tier of tiers) {
    try {
      const config = require(`../../configs/cards/${tier}.json`);
      const tName = getTierPropertyName(tier);
      const card = config[tName]?.find(
        (c) => c.id.toLowerCase() === String(cardId).toLowerCase()
      );
      if (card) return card;
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function formatTeamList(cardIds) {
  if (!cardIds || !cardIds.length) return "> *No cards in team*\n";

  let formattedList = "";
  for (const cardId of cardIds) {
    const card = getCardInfo(cardId);
    if (card) {
      formattedList += `> ${card.cardEmoji} **${card.name}** (\`${card.id}\`)\n`;
    } else {
      formattedList += `> ❌ Card not found (\`${cardId}\`)\n`;
    }
  }
  return formattedList;
}

function determineCardTier(cardId) {
  if (String(cardId).startsWith("40000")) return "darkMatter";
  if (String(cardId).startsWith("60000")) return "galaxyOpal";
  if (String(cardId).startsWith("50000")) return "pinkDiamond";
  if (String(cardId).startsWith("30000")) return "invincible";
  if (String(cardId).startsWith("20000")) return "goats";
  if (String(cardId).startsWith("10000")) return "100ovr";
  if (String(cardId).startsWith("70000")) return "amethys";
  if (String(cardId).startsWith("80000")) return "ruby";
  if (String(cardId).startsWith("90000")) return "sapphire";
  if (String(cardId).startsWith("95000")) return "emerald";

  const tiers = [
    "darkMatter",
    "goats",
    "100ovr",
    "invincible",
    "galaxyOpal",
    "pinkDiamond",
    "diamond",
    "amethys",
    "ruby",
    "sapphire",
    "emerald",
    "throwbacks",
  ];
  for (const tier of tiers) {
    try {
      const config = require(`../../configs/cards/${tier}.json`);
      const tName = getTierPropertyName(tier);
      if (
        config[tName]?.some(
          (c) => c.id.toLowerCase() === String(cardId).toLowerCase()
        )
      ) {
        return tier;
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error(`Could not determine tier for card ID: ${cardId}`);
}

function getTierPropertyName(tier) {
  switch (tier) {
    case "amethys":
      return "amethyst";
    case "bossBattles":
      return "bossBattles";
    case "special":
      return "100percent";
    case "100ovr":
      return "100ovr";
    case "throwbacks":
      return "throwback";
    default:
      return tier;
  }
}
