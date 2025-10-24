/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../database/UserSchema");
const { general, gems } = require("../../configs/emojis/main.json");

function displayEmojiForCard(card) {
  if (!card) return "🏀";
  if (card.gemTier) return card.gemTier;
  if (card.cardEmoji) return card.cardEmoji;
  return "🏀";
}

module.exports = {
  name: "collection",
  description: "View your card collection",
  async execute(message, args) {
    try {
      const userId = message.author.id;
      const user = await User.findOne({ discordId: userId });

      if (!user) {
        return message.reply(
          "You need to create an account first. Use !daily to start!"
        );
      }

      const cardConfigs = {
        emerald: require("../../configs/cards/emerald.json").emerald || [],
        sapphire: require("../../configs/cards/sapphire.json").sapphire || [],
        ruby: require("../../configs/cards/ruby.json").ruby || [],
        amethys: require("../../configs/cards/amethys.json").amethyst || [],
        diamond: require("../../configs/cards/diamond.json").diamond || [],
        pinkDiamond:
          require("../../configs/cards/pinkDiamond.json").pinkDiamond || [],
        galaxyOpal:
          require("../../configs/cards/galaxyOpal.json").galaxyOpal || [],
        darkMatter:
          require("../../configs/cards/darkMatter.json").darkMatter || [],
        invincible:
          require("../../configs/cards/invincible.json").invincible || [],
        "100ovr": require("../../configs/cards/100ovr.json")["100ovr"] || [],
        goats: require("../../configs/cards/goats.json").goats || [],
        boss: require("../../configs/cards/bossBattles.json").bossBattles || [],
        special:
          require("../../configs/cards/100percent.json")["100percent"] || [],
        throwback:
          require("../../configs/cards/throwbacks.json").throwback || [],
      };

      const completionRewards = require("../../configs/cards/100percent.json")[
        "100percent"
      ];
      const activeReward = completionRewards.find((reward) => reward.isActive);

      cardConfigs.special = cardConfigs.special.filter((card) => card.isActive);

      const collection = {};
      let totalOwned = 0;
      let totalPossible = 0;

      for (const [tier, cards] of Object.entries(cardConfigs)) {
        if (tier === "boss" || tier === "special") {
          const ownedCards = cards.filter((card) =>
            user.cards.includes(card.id)
          );
          collection[tier] = {
            owned: ownedCards.length,
            total: cards.length,
            percentage:
              Math.round((ownedCards.length / cards.length) * 100) || 0,
          };
          continue;
        }

        const ownedCards = cards.filter((card) => user.cards.includes(card.id));
        collection[tier] = {
          owned: ownedCards.length,
          total: cards.length,
          percentage: Math.round((ownedCards.length / cards.length) * 100) || 0,
        };
        totalOwned += ownedCards.length;
        totalPossible += cards.length;
      }

      const totalPercentage =
        Math.round((totalOwned / totalPossible) * 100) || 0;

      if (totalPercentage === 100 && activeReward) {
        if (!user.cards.includes(activeReward.id)) {
          user.cards.push(activeReward.id);
          await user.save();
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle("🎉 Collection Complete!")
                .setDescription(
                  `
> ${general.emptyLine}
> Congratulations! You've completed 100% of the collection!
> You've been awarded: ${activeReward.emoji} **${activeReward.name}**!
> ${general.emptyLine}`
                )
                .setFooter({
                  text: "NBA Vault • Collection Complete",
                  iconURL: message.author.displayAvatarURL(),
                })
                .setTimestamp(),
            ],
          });
        }
      }

      let description = `> ${general.emptyLine}\n`;
      description += `> 🏆 **Collection Progress**\n`;
      description += `> Total Progress: ${totalOwned}/${totalPossible} (${totalPercentage}%)\n`;
      description += `> ${general.emptyLine}\n`;

      for (const [tier, stats] of Object.entries(collection)) {
        if ((tier === "special" || tier === "boss") && stats.total === 0)
          continue;

        let tierEmoji;
        if (tier === "boss") {
          tierEmoji = "<:BOSS:1416185644811817041>";
        } else if (tier === "special") {
          tierEmoji = "<:SPECIAL:1416185646359511171>";
        } else {
          tierEmoji =
            tier === "100ovr"
              ? gems["100ovrGem"]
              : tier === "amethys"
              ? gems.amethystGem
              : gems[`${tier}Gem`];
        }

        const tierName =
          tier === "amethys"
            ? "amethyst"
            : tier.charAt(0).toUpperCase() + tier.slice(1);

        if (tier === "special" || tier === "boss") {
          description += `> ${tierEmoji || "📊"} **${tierName}**: ${
            stats.owned
          } cards\n`;
        } else {
          description += `> ${tierEmoji || "📊"} **${tierName}**: ${
            stats.owned
          }/${stats.total} (${stats.percentage}%)\n`;
        }
      }

      description += `> ${general.emptyLine}\n`;
      description += `> 🎁 **Current Collection Reward**\n`;
      if (activeReward) {
        description += `> ${activeReward.emoji} **${activeReward.name}**\n`;
        description += `> ${general.MTP} Value: \`${activeReward.price}\`\n`;
        description += `> Required: 100% Collection Completion\n`;
      } else {
        description += `> No active collection reward at this time.\n`;
      }
      description += `> ${general.emptyLine}\n`;

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${general.MyTEAM} Card Collection`)
        .setDescription(description)
        .setFooter({
          text: "NBA Vault • Collection",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      const tierMapping = {
        emerald: { label: "Emerald", value: "emerald", emoji: gems.emeraldGem },
        sapphire: {
          label: "Sapphire",
          value: "sapphire",
          emoji: gems.sapphireGem,
        },
        ruby: { label: "Ruby", value: "ruby", emoji: gems.rubyGem },
        amethys: {
          label: "Amethyst",
          value: "amethys",
          emoji: gems.amethystGem,
        },
        diamond: { label: "Diamond", value: "diamond", emoji: gems.diamondGem },
        pinkDiamond: {
          label: "Pink Diamond",
          value: "pinkDiamond",
          emoji: gems.pinkDiamondGem,
        },
        galaxyOpal: {
          label: "Galaxy Opal",
          value: "galaxyOpal",
          emoji: gems.galaxyOpalGem,
        },
        darkMatter: {
          label: "Dark Matter",
          value: "darkMatter",
          emoji: gems.darkMatterGem,
        },
        invincible: {
          label: "Invincible",
          value: "invincible",
          emoji: gems.invincibleGem,
        },
        "100ovr": {
          label: "100 OVR",
          value: "100ovr",
          emoji: gems["100ovrGem"],
        },
        goats: { label: "GOAT", value: "goats", emoji: gems.goatsGem },
        boss: {
          label: "Boss Cards",
          value: "boss",
          emoji: "<:BOSS:1416185644811817041>",
        },
        special: {
          label: "Special Cards",
          value: "special",
          emoji: "<:SPECIAL:1416185646359511171>",
        },
        throwback: {
          label: "Throwback",
          value: "throwback",
          emoji: gems.throwbackGem || "<:throwback_gem:1420388930368442439>",
        },
      };

      const menuOptions = [
        {
          label: "All Cards",
          value: "all",
          description: "Show all cards",
          emoji: "🏆",
        },
      ];

      Object.entries(tierMapping).forEach(([value, info]) => {
        menuOptions.push({
          label: info.label,
          value: value,
          description: `Show ${info.label} cards`,
          emoji: info.emoji,
        });
      });

      const filterMenu = new StringSelectMenuBuilder()
        .setCustomId("inventory_filter")
        .setPlaceholder("Filter by Card Tier")
        .addOptions(menuOptions);

      const row = new ActionRowBuilder().addComponents(filterMenu);

      if (args[0] && cardConfigs[args[0].toLowerCase()]) {
        const tier = args[0].toLowerCase();
        const cards = cardConfigs[tier];
        const ownedCards = cards.filter((card) => user.cards.includes(card.id));

        let tierEmoji;
        if (tier === "boss") {
          tierEmoji = "<:BOSS:1416185644811817041>";
        } else if (tier === "special") {
          tierEmoji = "<:SPECIAL:1416185646359511171>";
        } else {
          tierEmoji =
            tier === "100ovr" ? gems["100ovrGem"] : gems[`${tier}Gem`];
        }

        let filteredDesc = `> ${general.emptyLine}\n`;
        filteredDesc += `> ${tierEmoji || "📊"} **${
          tier.charAt(0).toUpperCase() + tier.slice(1)
        } Cards**\n`;

        if (tier !== "special" && tier !== "boss") {
          filteredDesc += `> Progress: ${ownedCards.length}/${
            cards.length
          } (${Math.round((ownedCards.length / cards.length) * 100)}%)\n`;
        }
        filteredDesc += `> ${general.emptyLine}\n`;

        cards.forEach((card) => {
          const owned = user.cards.includes(card.id);
          filteredDesc += `> ${owned ? "✅" : "❌"} ${displayEmojiForCard(
            card
          )} **${card.name}** (\`${card.id}\`)\n`;
        });

        const filteredEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(
            `${general.MyTEAM} ${
              tier.charAt(0).toUpperCase() + tier.slice(1)
            } Collection`
          )
          .setDescription(filteredDesc)
          .setFooter({
            text: "NBA Vault • Collection",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({
          embeds: [filteredEmbed],
          components: [row],
          fetchReply: true,
          allowedMentions: { repliedUser: false },
        });
      }

      return message.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error viewing your collection!");
    }
  },
};
