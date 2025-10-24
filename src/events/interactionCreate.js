/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder, Events } = require("discord.js");
const {
  chunkArray,
  createPaginationRow,
} = require("../utils/paginationHelper");
const { PendingBattle } = require("../database/BattleSchema");
const Team = require("../database/TeamSchema");
const User = require("../database/UserSchema");

const CARD_TIERS = {
  GOAT: 120,
  INVINCIBLE: 105,
  "100OVR": 100,
  DARK_MATTER: 95,
  GALAXY_OPAL: 90,
  PINK_DIAMOND: 85,
  DIAMOND: 80,
  AMETHYST: 75,
  RUBY: 70,
  SAPPHIRE: 65,
  EMERALD: 60,
  THROWBACK: 125,
};

function determineCardTier(cardId) {
  if (!cardId) return "emerald";
  const id = String(cardId).toLowerCase();
  if (id.includes("goat")) return "goats";
  if (id.includes("invincible")) return "invincible";
  if (id.includes("100ovr")) return "100ovr";
  if (id.includes("dark_matter")) return "darkMatter";
  if (id.includes("throwback")) return "throwbacks";
  if (id.includes("galaxy_opal")) return "galaxyOpal";
  if (id.includes("pink_diamond")) return "pinkDiamond";
  if (id.includes("diamond")) return "diamond";
  if (id.includes("amethyst")) return "amethys";
  if (id.includes("ruby")) return "ruby";
  if (id.includes("sapphire")) return "sapphire";
  if (id.includes("emerald")) return "emerald";
  return "emerald";
}

function getCardTier(cardId) {
  const tier = determineCardTier(cardId);
  switch (tier) {
    case "goats":
      return CARD_TIERS.GOAT;
    case "invincible":
      return CARD_TIERS.INVINCIBLE;
    case "100ovr":
      return CARD_TIERS["100OVR"];
    case "darkMatter":
      return CARD_TIERS.DARK_MATTER;
    case "galaxyOpal":
      return CARD_TIERS.GALAXY_OPAL;
    case "pinkDiamond":
      return CARD_TIERS.PINK_DIAMOND;
    case "diamond":
      return CARD_TIERS.DIAMOND;
    case "amethys":
      return CARD_TIERS.AMETHYST;
    case "ruby":
      return CARD_TIERS.RUBY;
    case "sapphire":
      return CARD_TIERS.SAPPHIRE;
    case "emerald":
      return CARD_TIERS.EMERALD;
    case "throwbacks":
      return CARD_TIERS.THROWBACK;
    default:
      return CARD_TIERS.EMERALD;
  }
}

function calculateTeamRating(cards) {
  return cards.reduce((sum, card) => sum + getCardTier(card), 0) / cards.length;
}

function formatEmoji(cardEmoji) {
  return cardEmoji || "";
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

function checkBattleCooldown(client, userId) {
  if (!client.cooldowns.has("battle")) {
    client.cooldowns.set("battle", new Map());
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get("battle");
  const cooldownAmount = 120 * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      return (expirationTime - now) / 1000;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return false;
}

function loadCardFile(name) {
  if (!name) return null;
  const fs = require("fs");
  const path = require("path");
  const base = path.join(__dirname, "..", "configs", "cards");
  const variants = [name];
  if (name.endsWith("s")) variants.push(name.slice(0, -1));
  else variants.push(name + "s");
  if (name === "amethys") variants.push("amethyst");
  if (name === "amethyst") variants.push("amethys");

  for (const v of variants) {
    try {
      const f = path.join(base, `${v}.json`);
      if (fs.existsSync(f)) {
        return require(`../configs/cards/${v}.json`);
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: "❌ This command is not available!",
          ephemeral: true,
        });
      }

      if (!client.cooldowns.has(command.data.name)) {
        client.cooldowns.set(command.data.name, new Map());
      }

      const now = Date.now();
      const timestamps = client.cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime =
          timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return interaction.reply({
            content: `⏱️ Please wait ${timeLeft.toFixed(
              1
            )} more second(s) before using this command again.`,
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        if (command.data.name === "battle") {
          const timeLeft = checkBattleCooldown(client, interaction.user.id);
          if (timeLeft) {
            return interaction.reply({
              content: `⏱️ Please wait ${timeLeft.toFixed(
                1
              )} more second(s) before battling again!`,
              ephemeral: true,
            });
          }
        }

        await command.execute(interaction, client);
      } catch (error) {
        console.error(
          `Error executing slash command ${command.data.name}:`,
          error
        );

        const errorEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("❌ Command Error")
          .setDescription("There was an error executing this command!")
          .setTimestamp();

        const errorResponse = { embeds: [errorEmbed], ephemeral: true };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorResponse);
        } else {
          await interaction.reply(errorResponse);
        }
      }
    }

    if (interaction.isButton()) {
      if (
        interaction.customId === "prev_page" ||
        interaction.customId === "next_page"
      ) {
        const messageAuthorId =
          interaction.message.interaction?.user.id ||
          interaction.message.mentions?.repliedUser?.id;
        if (messageAuthorId && messageAuthorId !== interaction.user.id) {
          return interaction.reply({
            content:
              "❌ Only the person who used this command can use these buttons!",
            ephemeral: true,
          });
        }

        try {
          const User = require("../database/UserSchema");
          const { general, gems } = require("../configs/emojis/main.json");

          const currentEmbed = interaction.message.embeds[0];
          const footerText = currentEmbed.footer.text;
          let currentPage = 0;
          const pageMatch = footerText.match(/Page (\d+)\/(\d+)/);
          if (pageMatch) {
            currentPage = parseInt(pageMatch[1]) - 1;
          }

          const titleWords = currentEmbed.title.split(" ");
          const selectedTier = titleWords.find((word) => {
            const lower = word.toLowerCase();
            return (
              !word.includes(":") &&
              lower !== "collection" &&
              lower !== "cards" &&
              !lower.includes("•") &&
              lower !== "myteam"
            );
          });

          let fileName;
          switch (selectedTier.toLowerCase()) {
            case "galaxyopal":
              fileName = "galaxyOpal";
              break;
            case "pinkdiamond":
              fileName = "pinkDiamond";
              break;
            case "darkmatter":
              fileName = "darkMatter";
              break;
            case "100ovr":
              fileName = "100ovr";
              break;
            default:
              fileName = selectedTier.toLowerCase();
          }
          const config = loadCardFile(fileName) || {};
          const propertyName =
            fileName === "amethys" || fileName === "amethyst"
              ? "amethys"
              : fileName === "throwbacks" || fileName === "throwback"
              ? "throwback"
              : fileName;
          const cards =
            config[propertyName] && Array.isArray(config[propertyName])
              ? config[propertyName]
              : [];

          const user = await User.findOne({ discordId: interaction.user.id });
          const ownedCards = cards.filter((card) =>
            user.cards.includes(card.id)
          );

          const CARDS_PER_PAGE = 25;
          const cardPages = chunkArray(cards, CARDS_PER_PAGE);
          const newPage =
            interaction.customId === "next_page"
              ? currentPage + 1
              : currentPage - 1;

          let gemEmoji;
          switch (fileName.toLowerCase()) {
            case "100ovr":
              gemEmoji = gems["100ovrGem"];
              break;
            case "galaxyopal":
              gemEmoji = gems["galaxyOpalGem"];
              break;
            case "pinkdiamond":
              gemEmoji = gems["pinkDiamondGem"];
              break;
            case "darkmatter":
              gemEmoji = gems["darkMatterGem"];
              break;
            case "diamond":
              gemEmoji = gems["diamondGem"];
              break;
            case "amethys":
              gemEmoji = gems["amethystGem"];
              break;
            case "ruby":
              gemEmoji = gems["rubyGem"];
              break;
            case "sapphire":
              gemEmoji = gems["sapphireGem"];
              break;
            case "emerald":
              gemEmoji = gems["emeraldGem"];
              break;
            case "boss":
              gemEmoji = "<:BOSS:1416185644811817041>";
              break;
            case "special":
              gemEmoji = "<:SPECIAL:1416185646359511171>";
              break;
            default:
              gemEmoji = "📊";
          }

          let description = `> ${general.emptyLine}\n`;
          description += `> ${gemEmoji || "📊"} **${
            selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)
          } Cards**\n`;
          description += `> Progress: ${ownedCards.length}/${
            cards.length
          } (${Math.round((ownedCards.length / cards.length) * 100)}%)\n`;
          description += `> ${general.emptyLine}\n`;

          if (newPage < 0 || newPage >= cardPages.length) {
            return interaction.reply({
              content: "That page does not exist!",
              flags: ["Ephemeral"],
            });
          }

          cardPages[newPage].forEach((card) => {
            const owned = user.cards.includes(card.id);
            description += `> ${owned ? "✅" : "❌"} ${formatEmoji(
              card.cardEmoji
            )} **${card.name}** (\`${card.id}\`)\n`;
          });

          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(currentEmbed.title)
            .setDescription(description)
            .setFooter({
              text: `NBA Vault • Collection • Page ${newPage + 1}/${
                cardPages.length
              }`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

          const paginationRow = createPaginationRow(newPage, cardPages.length);
          const filterRow = interaction.message.components[0];

          await interaction.update({
            embeds: [embed],
            components: [filterRow, paginationRow],
          });
        } catch (error) {
          console.error("Error handling pagination:", error);
          await interaction.reply({
            content: "There was an error changing the page!",
            flags: ["Ephemeral"],
          });
        }
      }

      if (
        interaction.customId.startsWith("accept_pvp_") ||
        interaction.customId.startsWith("decline_pvp_")
      ) {
        const battleId = interaction.customId.split("_")[2];
        const pendingBattle = await PendingBattle.findById(battleId);
        if (!client.cooldowns.has("battle")) {
          client.cooldowns.set("battle", new Map());
        }
        const now = Date.now();
        const timestamps = client.cooldowns.get("battle");
        const cooldownAmount = 120 * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime =
            timestamps.get(interaction.user.id) + cooldownAmount;
          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
              content: `⏱️ Please wait ${timeLeft.toFixed(
                1
              )} more second(s) before battling again!`,
              ephemeral: true,
            });
          }
        }

        if (!pendingBattle) {
          return interaction.reply({
            content: "❌ This battle challenge has expired!",
            ephemeral: true,
          });
        }

        if (interaction.user.id !== pendingBattle.defenderId) {
          return interaction.reply({
            content: "❌ Only the challenged player can respond to this!",
            ephemeral: true,
          });
        }

        if (interaction.customId.startsWith("decline_pvp_")) {
          await PendingBattle.findByIdAndDelete(battleId);
          await interaction.message.edit({
            components: [],
            content: "🚫 Battle challenge declined!",
            embeds: [],
          });
          return;
        }

        const challenger = await Team.findOne({
          discordId: pendingBattle.challengerId,
        });
        const defender = await Team.findOne({
          discordId: pendingBattle.defenderId,
        });

        if (!challenger || !defender) {
          await PendingBattle.findByIdAndDelete(battleId);
          await interaction.message.edit({ components: [] });
          return interaction.reply(
            "❌ One of the players no longer has a team!"
          );
        }

        await interaction.deferReply();

        const challengerTeam = { cards: challenger.cards };
        const defenderTeam = { cards: defender.cards };

        const startEmbed = {
          color: 0x0099ff,
          title: "⚔️ PvP Battle Starts!",
          description: `**The game begins!**\n> 🎮 <@${
            pendingBattle.challengerId
          }> vs <@${
            pendingBattle.defenderId
          }>\n> 🎯 First to 14 Points\n\n**Team Ratings:**\n> Challenger: ${calculateTeamRating(
            challenger.cards
          ).toFixed(1)}\n> Defender: ${calculateTeamRating(
            defender.cards
          ).toFixed(1)}`,
          footer: { text: "NBA Vault • PvP Battle" },
          timestamp: new Date(),
        };

        await interaction.editReply({ embeds: [startEmbed] });
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let userScore = 0;
        let bossScore = 0;
        const commentary = [];

        while (userScore < 14 && bossScore < 14) {
          for (const card of challengerTeam.cards) {
            if (userScore >= 14 || bossScore >= 14) break;
            const cardOverall = getCardTier(card);
            let scoreChance = Math.min(0.8, cardOverall / 150 + 0.3);

            if (determineCardTier(card) === "throwbacks") {
              scoreChance *= 1.08;
            }

            const cardConfig = loadCardFile(determineCardTier(card)) || {};
            const tierProperty = getTierPropertyName(determineCardTier(card));
            const cardInfo = cardConfig[tierProperty]?.find(
              (c) => c.id === card
            );
            const emoji = cardInfo?.cardEmoji || "<:dot:1425254845295886460>";
            const name = cardInfo?.name || card;

            if (Math.random() < scoreChance) {
              const points = Math.random() < 0.25 ? 3 : 2;
              userScore += points;
              commentary.push({
                text: `${emoji} **${name}** scores ${points} points!`,
                owner: "challenger",
                points,
              });
            } else {
              commentary.push({
                text: `${emoji} **${name}** misses the shot!`,
                owner: "challenger",
                points: 0,
              });
            }
          }

          if (userScore >= 14 || bossScore >= 14) break;

          for (const card of defenderTeam.cards) {
            if (userScore >= 14 || bossScore >= 14) break;
            const cardOverall = getCardTier(card);
            const scoreChance = Math.min(0.8, cardOverall / 150 + 0.3);

            const cardConfig = loadCardFile(determineCardTier(card)) || {};
            const tierProperty = getTierPropertyName(determineCardTier(card));
            const cardInfo = cardConfig[tierProperty]?.find(
              (c) => c.id === card
            );
            const emoji = cardInfo?.cardEmoji || "<:dot:1425254845295886460>";
            const name = cardInfo?.name || card;

            if (Math.random() < scoreChance) {
              const points = Math.random() < 0.25 ? 3 : 2;
              bossScore += points;
              commentary.push({
                text: `${emoji} **${name}** scores ${points} points!`,
                owner: "defender",
                points,
              });
            } else {
              commentary.push({
                text: `${emoji} **${name}** misses the shot!`,
                owner: "defender",
                points: 0,
              });
            }
          }
        }

        const result = {
          userScore,
          bossScore,
          commentary,
        };

        let currentChallengerScore = 0;
        let currentDefenderScore = 0;

        for (const play of result.commentary) {
          if (play.points > 0) {
            if (play.owner === "challenger")
              currentChallengerScore += play.points;
            else currentDefenderScore += play.points;
          }

          const playEmbed = {
            color: 0x0099ff,
            title: "⚔️ PvP Battle - Live Play",
            description: `**📊 Current Score**\n> Challenger: **${currentChallengerScore}** Points\n> Defender: **${currentDefenderScore}** Points\n\n**🎯 Latest Play**\n> ${play.text}`,
            footer: { text: "NBA Vault • PvP Battle" },
            timestamp: new Date(),
          };

          await interaction.editReply({ embeds: [playEmbed] });
          await new Promise((resolve) => setTimeout(resolve, 1500));

          if (currentChallengerScore >= 14 || currentDefenderScore >= 14) break;
        }

        const winner =
          currentChallengerScore > currentDefenderScore
            ? pendingBattle.challengerId
            : pendingBattle.defenderId;
        const winnerDoc = await User.findOne({ discordId: winner });
        const rewards = [];

        const margin = Math.abs(currentChallengerScore - currentDefenderScore);
        const baseMultiplier = 1 + margin * 0.1;

        if (Math.random() < 0.6) {
          const vcAmount = Math.floor(
            (25000 + Math.random() * 175000) * baseMultiplier
          );
          rewards.push({ type: "vc", amount: vcAmount });
        } else {
          const mtAmount = Math.floor(
            (5000 + Math.random() * 145000) * baseMultiplier
          );
          rewards.push({ type: "mt", amount: mtAmount });
        }

        if (margin >= 5 || Math.random() < 0.15) {
          const packs = [
            "superDeluxe",
            "goats",
            "invincible",
            "darkMatter",
            "galaxyOpal",
          ];
          const packIndex = Math.min(Math.floor(margin / 3), packs.length - 1);
          rewards.push({ type: "pack", id: packs[packIndex] });
        }

        for (const reward of rewards) {
          if (reward.type === "vc") {
            winnerDoc.vc = (winnerDoc.vc || 0) + reward.amount;
          } else if (reward.type === "mt") {
            winnerDoc.mt = (winnerDoc.mt || 0) + reward.amount;
          } else if (reward.type === "pack") {
            winnerDoc.packs = winnerDoc.packs || [];
            winnerDoc.packs.push(reward.id);
          }
        }

        await winnerDoc.save();
        await PendingBattle.findByIdAndDelete(battleId);

        const { general } = require("../configs/emojis/main.json");

        const rewardsText = rewards
          .map((r) => {
            if (r.type === "vc")
              return `${
                general.VC || "💰"
              } **${r.amount.toLocaleString()}** VC`;
            if (r.type === "mt")
              return `${
                general.MTP || "💎"
              } **${r.amount.toLocaleString()}** MT`;
            if (r.type === "pack")
              return `${general.Pack || "📦"} **${r.id}** Pack`;
          })
          .join("\n");

        const calculateStats = (cards, commentary) => {
          let stats = "";
          for (const card of cards) {
            const cardConfig = loadCardFile(determineCardTier(card)) || {};
            const tierProperty = getTierPropertyName(determineCardTier(card));
            const cardInfo = cardConfig[tierProperty]?.find(
              (c) => c.id === card
            );
            const cardName = cardInfo?.name || card;
            const emoji = cardInfo?.cardEmoji || "<:dot:1425254845295886460>";

            const cardPlays = commentary.filter((p) =>
              p.text.includes(cardName)
            );
            const points = cardPlays.reduce(
              (sum, p) => sum + (p.points || 0),
              0
            );
            const attempts = cardPlays.length;
            const makes = cardPlays.filter((p) => p.points > 0).length;

            stats += `> ${emoji} **${cardName}** - ${points} PTS (${makes}/${attempts} FG)\n`;
          }
          return stats;
        };

        const challengerStats = calculateStats(
          challenger.cards,
          result.commentary
        );
        const defenderStats = calculateStats(defender.cards, result.commentary);

        const resultEmbed = {
          color: winner === pendingBattle.challengerId ? 0x00ff00 : 0xff0000,
          title: "🏆 PvP Battle Results",
          description: `
**${winner === pendingBattle.challengerId ? "Challenger" : "Defender"} Wins!**
> 🎮 <@${pendingBattle.challengerId}> vs <@${pendingBattle.defenderId}>
> 🎯 Final Score: **${currentChallengerScore}** - **${currentDefenderScore}**

**Challenger's Team Stats**
${challengerStats || "> No stats available"}

**Defender's Team Stats**
${defenderStats || "> No stats available"}

**🎁 Winner's Rewards:**
${rewardsText}`,
          footer: { text: "NBA Vault • PvP Battle" },
          timestamp: new Date(),
        };

        await interaction.message.edit({
          embeds: [resultEmbed],
          components: [],
        });

        const finishedEmbed = {
          color: 0x0099ff,
          title: "⚔️ PvP Battle",
          description: `**Battle Finished!**\n> Winner: <@${winner}>`,
          footer: { text: "NBA Vault • PvP Battle" },
          timestamp: new Date(),
        };
        await interaction.editReply({ embeds: [finishedEmbed], content: null });
      }
    }

    if (interaction.isAnySelectMenu()) {
      if (interaction.customId === "inventory_filter") {
        const messageAuthorId =
          interaction.message.interaction?.user.id ||
          interaction.message.mentions?.repliedUser?.id;
        if (messageAuthorId && messageAuthorId !== interaction.user.id) {
          return interaction.reply({
            content:
              "❌ Only the person who used this command can use this menu!",
            ephemeral: true,
          });
        }

        try {
          const User = require("../database/UserSchema");
          const { general, gems } = require("../configs/emojis/main.json");

          await interaction.deferUpdate().catch(console.error);

          const user = await User.findOne({ discordId: interaction.user.id });
          if (!user) {
            await interaction
              .followUp({
                content:
                  "You need to create an account first. Use !daily to start!",
                flags: ["Ephemeral"],
              })
              .catch(console.error);
            return;
          }

          const selectedTier = interaction.values[0];
          let cards;
          if (selectedTier === "all") {
            await interaction
              .editReply({
                components: [interaction.message.components[0]],
              })
              .catch(console.error);
            return;
          } else {
            let config;
            let propertyName;

            if (selectedTier === "boss") {
              config = require("../configs/cards/bossBattles.json");
              propertyName = "bossBattles";
              cards = config[propertyName] || [];
            } else if (selectedTier === "special") {
              config = require("../configs/cards/100percent.json");
              propertyName = "100percent";
              cards = (config[propertyName] || []).filter(
                (card) => card.isActive
              );
            } else {
              config = loadCardFile(selectedTier) || {};
              propertyName =
                selectedTier === "amethys"
                  ? "amethyst"
                  : selectedTier === "throwback"
                  ? "throwback"
                  : selectedTier;
              cards =
                config[propertyName] && Array.isArray(config[propertyName])
                  ? config[propertyName]
                  : [];
            }
          }
          let gemEmoji;
          switch (selectedTier.toLowerCase()) {
            case "100ovr":
              gemEmoji = gems["100ovrGem"];
              break;
            case "galaxyopal":
              gemEmoji = gems["galaxyOpalGem"];
              break;
            case "pinkdiamond":
              gemEmoji = gems["pinkDiamondGem"];
              break;
            case "darkmatter":
              gemEmoji = gems["darkMatterGem"];
              break;
            case "diamond":
              gemEmoji = gems["diamondGem"];
              break;
            case "amethys":
              gemEmoji = gems["amethystGem"];
              break;
            case "ruby":
              gemEmoji = gems["rubyGem"];
              break;
            case "sapphire":
              gemEmoji = gems["sapphireGem"];
              break;
            case "emerald":
              gemEmoji = gems["emeraldGem"];
              break;
            case "boss":
              gemEmoji = "<:BOSS:1416185644811817041>";
              break;
            case "special":
              gemEmoji = "<:SPECIAL:1416185646359511171>";
              break;
            default:
              gemEmoji = "📊";
          }
          const ownedCards = cards.filter((card) =>
            user.cards.includes(card.id)
          );
          const CARDS_PER_PAGE = 25;
          const cardPages = chunkArray(cards, CARDS_PER_PAGE);
          const currentPage = 0;

          if (!cardPages.length) {
            return interaction.editReply({
              content: "No cards found for this tier!",
              flags: ["Ephemeral"],
            });
          }

          let description = `> ${general.emptyLine}\n`;
          description += `> ${gemEmoji || "📊"} **${
            selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)
          } Cards**\n`;
          if (selectedTier === "boss" || selectedTier === "special") {
            description += `> You have ${ownedCards.length} card${
              ownedCards.length !== 1 ? "s" : ""
            }\n`;
          } else {
            description += `> Progress: ${ownedCards.length}/${
              cards.length
            } (${Math.round((ownedCards.length / cards.length) * 100)}%)\n`;
          }
          description += `> ${general.emptyLine}\n`;
          const currentPageCards = cardPages[currentPage] || [];
          currentPageCards.forEach((card) => {
            const owned = user.cards.includes(card.id);
            description += `> ${owned ? "✅" : "❌"} ${formatEmoji(
              card.cardEmoji
            )} **${card.name}** (\`${card.id}\`)\n`;
          });

          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(
              `${general.MyTEAM} ${
                selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)
              } Collection`
            )
            .setDescription(description)
            .setFooter({
              text: `NBA Vault • Collection • Page ${currentPage + 1}/${
                cardPages.length
              }`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();
          const paginationRow = createPaginationRow(
            currentPage,
            cardPages.length
          );
          const filterRow = interaction.message.components[0];

          await interaction
            .editReply({
              embeds: [embed],
              components: [filterRow, paginationRow],
            })
            .catch(console.error);
        } catch (error) {
          console.error("Error handling inventory filter:", error);
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.deferUpdate().catch(console.error);
            }
            await interaction
              .followUp({
                content: "There was an error filtering your collection!",
                flags: ["Ephemeral"],
              })
              .catch(console.error);
          } catch (e) {
            console.error("Could not send error message:", e);
          }
        }
      }
    }

    if (interaction.isModalSubmit()) {
    }
  },
};
