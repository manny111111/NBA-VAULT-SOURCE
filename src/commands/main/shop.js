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
const Shop = require("../../database/ShopSchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "shop",
  description: "View the available cards and packs in the shop",
  usage: "!shop <cards|packs>",
  async execute(message, args) {
    try {
      const shop = await Shop.findOne();

      if (!shop) {
        return message.reply(
          "Shop is currently unavailable. Please try again later."
        );
      }

      const type = args[0]?.toLowerCase();

      if (!type || (type !== "cards" && type !== "packs")) {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${general.MyTEAM} NBA Vault Shop`)
          .setDescription(
            `
> ${general.emptyLine}
> Use \`!shop cards\` to view available cards
> Use \`!shop packs\` to view available packs
> ${general.emptyLine}
> ${general.MTP} Use MT Points to buy cards
> ${general.VC} Use VC to buy packs
`
          )
          .setFooter({
            text: "NBA Vault • Shop",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (type === "cards") {
        let description = `> ${general.emptyLine}\n`;
        let hasCards = false;

        for (const [tier, cards] of Object.entries(shop.cards)) {
          if (cards && cards.length > 0) {
            hasCards = true;
            cards.forEach((card) => {
              description += `> ${card.cardEmoji} **${card.name}** (${card.gemTier})\n`;
              description += `> ${general.MTP} Price: \`${card.price}\`\n`;
              description += `> ID: \`${card.id}\`\n`;
              description += `> ${general.emptyLine}\n`;
            });
          }
        }

        if (!hasCards) {
          return message.reply("No cards are currently available in the shop.");
        }

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${general.MyTEAM} Available Cards`)
          .setDescription(description)
          .setFooter({
            text: "NBA Vault • Shop Cards",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (type === "packs") {
        let description = `> ${general.emptyLine}\n`;

        const packsFromDb = Object.assign({}, shop.packs || {});

        try {
          if (!packsFromDb.throwback) {
            const tbCfg = require("../../configs/packs/throwback.json");
            const key = Object.keys(tbCfg).find((k) =>
              k.toLowerCase().includes("throwback")
            );
            const settings =
              (tbCfg && (tbCfg[key] || tbCfg.throwbackSettings)) || null;
            if (settings) {
              let price = 0;
              if (settings.throwbackPrice) {
                price =
                  parseInt(
                    String(settings.throwbackPrice).replace(/[,\s]/g, "")
                  ) || 0;
              }
              packsFromDb.throwback = {
                name: "throwback",
                price: price,
                emoji: settings.emoji || "<:throwback_gem:1420388930368442439>",
              };
            }
          }
        } catch (e) {
          // ignore
        }

        Object.values(packsFromDb).forEach((pack) => {
          if (pack && pack.emoji) {
            description += `> ${pack.emoji} **${
              pack.displayName ||
              pack.name.charAt(0).toUpperCase() + pack.name.slice(1)
            } Pack**\n`;
            if (typeof pack.price === "number") {
              description += `> ${
                general.VC
              } Price: \`${pack.price.toLocaleString()} VC\`\n`;
            } else if (pack.price) {
              description += `> ${general.VC} Price: \`${String(
                pack.price
              )} VC\`\n`;
            }
            description += `> Type: \`${pack.name}\`\n`;
            description += `> ${general.emptyLine}\n`;
          }
        });

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${general.MyTEAM} Available Packs`)
          .setDescription(description)
          .setFooter({
            text: "NBA Vault • Shop Packs",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      return message.reply("There was an error accessing the shop!");
    }
  },
};
