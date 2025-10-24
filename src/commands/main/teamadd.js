/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const User = require("../../database/UserSchema");
const Team = require("../../database/TeamSchema");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "teamadd",
  description: "Add a card to your team",
  aliases: ["ta"],
  usage: "!teamadd <cardId>",
  async execute(message, args) {
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(`${general.MyTEAM} Team Management`)
        .setDescription(
          `
> ${general.emptyLine}
> Please provide a card ID to add to your team
> Example: \`!teamadd <cardId>\`
> ${general.emptyLine}`
        )
        .setFooter({
          text: "NBA Vault • Team Management",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const cardId = args[0];
    const discordId = message.author.id;

    try {
      let cardInfo;
      try {
        const cardTier = determineCardTier(cardId);
        const cardConfig = require(`../../configs/cards/${cardTier}.json`);
        const tierName = getTierPropertyName(cardTier);
        cardInfo = cardConfig[tierName]?.find(
          (c) => c.id.toLowerCase() === cardId.toLowerCase()
        );
      } catch (error) {
        console.error(`Error finding card ${cardId}:`, error);
      }

      let user = await User.findOne({ discordId });
      if (!user) {
        user = new User({
          discordId,
          username: message.author.username,
          cards: [],
        });
        await user.save();
      }
      if (
        !Array.isArray(user.cards) ||
        !user.cards.some(
          (c) => c.toLowerCase() === (cardId || "").toLowerCase()
        )
      ) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> ❌ You don't own ${
              cardInfo
                ? `${cardInfo.cardEmoji} **${cardInfo.name}**`
                : `this card (\`${cardId}\`)`
            }!
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      let team = await Team.findOne({ discordId: discordId });
      if (!team) {
        team = new Team({ discordId: discordId, cards: [] });
        await team.save();
      }

      if (team.cards.some((c) => c.toLowerCase() === cardId.toLowerCase())) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> ❌ This card is already in your team!
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      if (team.cards.length >= 4) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle(`${general.MyTEAM} Team Management`)
          .setDescription(
            `
> ${general.emptyLine}
> ❌ Your team is already full! Remove a card first using \`!teamremove <cardId>\`
> ${general.emptyLine}`
          )
          .setFooter({
            text: "NBA Vault • Team Management",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const canonicalCardId =
        user.cards.find((c) => c.toLowerCase() === cardId.toLowerCase()) ||
        cardId;
      team.cards.push(canonicalCardId);
      await team.save();

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(`${general.MyTEAM} Team Management`)
        .setDescription(
          `
> ${general.emptyLine}
> ✅ ${cardInfo?.cardEmoji || "📊"} **${
            cardInfo?.name || cardId
          }** has been added to your team!
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
      console.error("Error in teamadd command:", error);
      const errorMessage = "There was an error adding the card to your team!";
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(`${general.MyTEAM} Team Management`)
        .setDescription(
          `
> ${general.emptyLine}
> ${errorMessage}
> ${general.emptyLine}`
        )
        .setFooter({
          text: "NBA Vault • Team Management",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
  },
};

function determineCardTier(cardId) {
  if (typeof cardId === "string" && cardId.includes("_BOSS:"))
    return "bossBattles";
  if (typeof cardId === "string" && cardId.includes("(BOSS)"))
    return "bossBattles";

  const tiers = [
    "100ovr",
    "galaxyOpal",
    "pinkDiamond",
    "diamond",
    "amethys",
    "ruby",
    "sapphire",
    "emerald",
    "throwbacks",
    "bossBattles",
    "invincible",
    "goats",
    "darkMatter",
  ];

  for (const tier of tiers) {
    try {
      const config = require(`../../configs/cards/${tier}.json`);
      const propertyName = getTierPropertyName(tier);
      if (
        config[propertyName] &&
        config[propertyName].some(
          (c) => String(c.id).toLowerCase() === String(cardId).toLowerCase()
        )
      ) {
        return tier;
      }
    } catch (error) {
      continue;
    }
  }

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
  if (String(cardId).toLowerCase().startsWith("boss")) return "bossBattles";

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

async function formatTeamList(cardIds) {
  if (!cardIds.length) return "> *No cards in team*\n";

  let formattedList = "";
  for (let i = 0; i < cardIds.length; i++) {
    const cardId = cardIds[i];

    try {
      if (typeof cardId === "string" && cardId.includes(":")) {
        const [emoji, ...nameParts] = cardId.split(" ");
        const name = nameParts.join(" ");
        formattedList += `> ${i + 1}. ${emoji} **${name}** (\`${cardId}\`)\n`;
        continue;
      }

      const tier = determineCardTier(cardId);
      const cardConfig = require(`../../configs/cards/${tier}.json`);
      const tierName = getTierPropertyName(tier);

      const card = cardConfig[tierName]?.find(
        (c) => c.id === cardId || c.id.toLowerCase() === cardId.toLowerCase()
      );

      if (card) {
        formattedList += `> ${i + 1}. ${card.cardEmoji || "📊"} **${
          card.name
        }** (\`${card.id}\`)\n`;
      } else {
        console.log(`Card not found in ${tier}.json: ${cardId}`);
        formattedList += `> ${i + 1}. 📊 **${cardId}** (\`${cardId}\`)\n`;
      }
    } catch (error) {
      console.error(`Error formatting card ${cardId}:`, error);
      formattedList += `> ${i + 1}. 📊 **${cardId}** (\`${cardId}\`)\n`;
    }
  }
  return formattedList;
}
