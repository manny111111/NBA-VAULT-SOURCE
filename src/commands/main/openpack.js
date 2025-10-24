/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const User = require("../../database/UserSchema");
const Pack = require("../../database/PacksSchema");
const cardEmbed = require("../../configs/embeds/packEmbeds");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");
const packEmojis = require("../../configs/emojis/packs.json").packs;

module.exports = {
  name: "openpack",
  description: "Open a pack from your inventory",
  usage: "!openpack <packType>",
  async execute(message, args) {
    try {
      const normalizePack = (p) => {
        if (!p || typeof p !== "string") return null;
        let s = p.replace(/[^a-z0-9]/gi, "").toLowerCase();
        s = s.replace(/pack$/i, "");
        if (s === "vaultunlimited") return "vaultUnlimited";
        if (s === "100ovr") return "100ovr";
        return s;
      };

      if (!args[0]) {
        return message.reply(
          "Please specify a pack type to open! Example: `!openpack base`"
        );
      }

      const inputPackType = args[0].toLowerCase();
      const amount = parseInt(args[1]) || 1;

      if (amount > 1) {
        const user = await User.findOne({ discordId: message.author.id });
        const packCount =
          user.packs?.filter(
            (p) => normalizePack(p) === normalizePack(inputPackType)
          ).length || 0;

        if (packCount < amount) {
          return message.reply(
            `You only have ${packCount} ${inputPackType} packs!`
          );
        }

        if (amount > 20) {
          return message.reply("You can only open up to 20 packs at once!");
        }
      }

      const user = await User.findOne({ discordId: message.author.id });
      if (!user) {
        return message.reply(
          "You need to create an account first! Use `!daily` to start."
        );
      }

      const packType = (user.packs || []).find((pack) => {
        if (!pack || typeof pack !== "string") return false;
        return normalizePack(pack) === normalizePack(inputPackType);
      });

      if (!packType) {
        return message.reply(
          `You don't have any ${inputPackType} packs! Use \`!shop packs\` to buy some.`
        );
      }

      const canonical = normalizePack(packType) || packType;
      const packConfigPath = `../../configs/packs/${canonical}.json`;
      let packConfig = null;
      try {
        packConfig = require(packConfigPath);
      } catch (e) {
        packConfig = require(`../../configs/packs/${packType}.json`);
      }

      let settings = null;
      const lcPack = (packType || "").toLowerCase();

      for (const key of Object.keys(packConfig)) {
        const lk = key.toLowerCase();
        if (lk.includes(lcPack) && lk.includes("settings")) {
          settings = packConfig[key];
          break;
        }
      }

      if (!settings) {
        const matchKey = Object.keys(packConfig).find((k) =>
          k.toLowerCase().includes(lcPack)
        );
        if (matchKey) settings = packConfig[matchKey];
      }

      if (!settings) {
        settings =
          packConfig[`${packType}Settings`] ||
          packConfig[`${packType}Price`] ||
          null;
      }

      if (!settings) {
        return message.reply("Invalid pack type!");
      }

      let possibleCards = [];

      const cardTypes = {
        "100ovrCards": "100ovr",
        goatsCards: "goats",
        amethystCards: "amethys",
        diamondCards: "diamond",
        rubyCards: "ruby",
        sapphireCards: "sapphire",
        emeraldCards: "emerald",
        darkMatterCards: "darkMatter",
        pinkDiamondCards: "pinkDiamond",
        galaxyOpalCards: "galaxyOpal",
        invincibleCards: "invincible",
        throwbackCards: "throwbacks",
      };

      for (const [settingKey, fileName] of Object.entries(cardTypes)) {
        if (settings[settingKey]) {
          try {
            const cardConfig = require(`../../configs/cards/${fileName}.json`);
            const propertyName =
              fileName === "amethys"
                ? "amethys"
                : fileName === "throwbacks"
                ? "throwback"
                : fileName;
            if (
              cardConfig[propertyName] &&
              Array.isArray(cardConfig[propertyName])
            ) {
              possibleCards = possibleCards.concat(cardConfig[propertyName]);
            }
          } catch (error) {
            console.error(`Error loading cards from ${fileName}.json:`, error);
          }
        }
      }

      if (possibleCards.length === 0) {
        return message.reply("This pack type has no available cards!");
      }
      let totalWeight = 0;
      const boostedCards = possibleCards.map((card) => {
        let weight = parseFloat(card.packChance) || 0;

        if (packType === "vaultUnlimited") {
          if (
            card.id.includes("darkMatter") ||
            card.id.includes("goats") ||
            card.id.includes("100ovr") ||
            card.id.includes("galaxyOpal")
          ) {
            weight *= 2.5;
          }
        }

        totalWeight += weight;
        return { card, weight };
      });

      let random = Math.random() * totalWeight;
      let selectedCard;

      for (const { card, weight } of boostedCards) {
        random -= weight;
        if (random <= 0) {
          selectedCard = card;
          break;
        }
      }

      if (!selectedCard) {
        selectedCard =
          possibleCards[Math.floor(Math.random() * possibleCards.length)];
      }

      const packIndex = (user.packs || []).findIndex(
        (p) => normalizePack(p) === normalizePack(packType)
      );

      if (amount > 1) {
        const pulls = [];
        let totalMT = 0;

        for (let i = 0; i < amount; i++) {
          let cardPull = selectedCard;
          if (i > 0) {
            random = Math.random() * totalWeight;
            for (const { card, weight } of boostedCards) {
              random -= weight;
              if (random <= 0) {
                cardPull = card;
                break;
              }
            }
            if (!cardPull)
              cardPull =
                possibleCards[Math.floor(Math.random() * possibleCards.length)];
          }

          if (user.cards && user.cards.includes(cardPull.id)) {
            let saleMT = 0;
            if (cardPull.price && typeof cardPull.price === "string") {
              const m = cardPull.price.match(/[\d,]+/);
              if (m) {
                saleMT = parseInt(m[0].replace(/,/g, "")) || 0;
                const isVip = message.member?.roles?.cache?.has(
                  process.env.VIP_ROLE_ID
                );
                saleMT = Math.max(
                  0,
                  Math.floor(saleMT * (isVip ? 0.75 : 0.65))
                );
              }
            }
            if (!saleMT) {
              const overall = cardPull.overall ? Number(cardPull.overall) : 85;
              saleMT = Math.max(1000, Math.floor(overall * 1000));
            }
            totalMT += saleMT;
            pulls.push({ card: cardPull, duplicate: true, mt: saleMT });
          } else {
            user.cards = user.cards || [];
            user.cards.push(cardPull.id);
            pulls.push({ card: cardPull, duplicate: false });
          }

          const idx = user.packs.findIndex(
            (p) => normalizePack(p) === normalizePack(packType)
          );
          if (idx !== -1) user.packs.splice(idx, 1);
        }

        user.mt = (user.mt || 0) + totalMT;
        await user.save();

        const tierPulls = pulls.reduce((acc, pull) => {
          const tier = pull.card.id.includes("goat")
            ? "GOAT"
            : pull.card.id.includes("invincible")
            ? "Invincible"
            : pull.card.id.includes("100ovr")
            ? "100 OVR"
            : pull.card.id.includes("darkMatter")
            ? "Dark Matter"
            : pull.card.id.includes("galaxyOpal")
            ? "Galaxy Opal"
            : pull.card.id.includes("pinkDiamond")
            ? "Pink Diamond"
            : pull.card.id.includes("diamond")
            ? "Diamond"
            : pull.card.id.includes("amethys")
            ? "Amethyst"
            : pull.card.id.includes("ruby")
            ? "Ruby"
            : pull.card.id.includes("sapphire")
            ? "Sapphire"
            : pull.card.id.includes("emerald")
            ? "Emerald"
            : "Other";

          if (!acc[tier]) acc[tier] = [];
          acc[tier].push(pull);
          return acc;
        }, {});

        const description = [
          `${packEmojis[packType] || "📦"} **Opened ${amount}x ${
            packType.charAt(0).toUpperCase() + packType.slice(1)
          } Packs**\n`,
        ];

        const tiers = [
          "GOAT",
          "Invincible",
          "100 OVR",
          "Dark Matter",
          "Galaxy Opal",
          "Pink Diamond",
          "Diamond",
          "Amethyst",
          "Ruby",
          "Sapphire",
          "Emerald",
          "Other",
        ];
        for (const tier of tiers) {
          if (tierPulls[tier]?.length) {
            description.push(`\n__${tier}__`);
            tierPulls[tier].forEach((pull) => {
              const card = pull.card;
              description.push(
                `${card.cardEmoji || ""}  **${card.name}** | ${
                  card.teamEmoji || ""
                } ${card.team}${
                  pull.duplicate
                    ? ` | ${general.MTP} \`${pull.mt.toLocaleString()}\``
                    : ""
                }`
              );
            });
          }
        }

        if (totalMT > 0) {
          description.push(
            `\n**Total Auto-Sell:** ${
              general.MTP
            } \`${totalMT.toLocaleString()} MT\``
          );
        }

        const bulkEmbed = new EmbedBuilder()
          .setColor("#f1c40f")
          .setTitle(`Pack Opening Results`)
          .setDescription(description.join("\n"))
          .setFooter({
            text: `NBA Vault • Pack Opening`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [bulkEmbed] });
      }

      if (user.cards && user.cards.includes(selectedCard.id)) {
        let saleMT = 0;
        if (
          selectedCard &&
          selectedCard.price &&
          typeof selectedCard.price === "string"
        ) {
          const m = selectedCard.price.match(/[\d,]+/);
          if (m) {
            saleMT = parseInt(m[0].replace(/,/g, "")) || 0;
            const isVip = message.member?.roles?.cache?.has(
              process.env.VIP_ROLE_ID
            );
            saleMT = Math.max(0, Math.floor(saleMT * (isVip ? 0.75 : 0.65)));
          }
        }
        if (!saleMT) {
          const overall =
            selectedCard && selectedCard.overall
              ? Number(selectedCard.overall)
              : 85;
          saleMT = Math.max(1000, Math.floor(overall * 1000));
        }

        user.mt = (user.mt || 0) + saleMT;
        if (packIndex !== -1) user.packs.splice(packIndex, 1);
        await user.save();

        const dupEmbed = new EmbedBuilder()
          .setColor("#f1c40f")
          .setTitle(`${general.MyTEAM} Pack Opened — Duplicate Auto-Sold`)
          .setDescription(
            `> ${selectedCard.cardEmoji || ""} **${
              selectedCard.name || selectedCard.id
            }** was a duplicate and was automatically sold for ${
              general.MTP || "MT"
            } \`${saleMT.toLocaleString()} MT\`.`
          )
          .setFooter({
            text: "NBA Vault • Pack Opened",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [dupEmbed] });
      } else {
        user.cards = user.cards || [];
        user.cards.push(selectedCard.id);
        if (packIndex !== -1) user.packs.splice(packIndex, 1);
        await user.save();
        await cardEmbed(message, selectedCard, `${packType}Pack`);
      }
    } catch (error) {
      console.error("Error in openpack command:", error);
      message.reply("There was an error opening your pack!");
    }
  },
};
