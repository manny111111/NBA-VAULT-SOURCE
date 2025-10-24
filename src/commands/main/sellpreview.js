/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "sellpreview",
  description: "Preview sell price, tax and net MT for a card",
  usage: "!sellpreview <cardId>",
  async execute(message, args) {
    try {
      const cardIdInput = args[0];
      if (!cardIdInput) return message.reply("❌ Usage: !sellpreview <cardId>");

      const cardsDir = path.join(__dirname, "../../configs/cards");
      const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));
      let cardObj = null;
      let sourceFile = null;

      for (const file of files) {
        try {
          const p = path.join(cardsDir, file);
          delete require.cache[require.resolve(p)];
          const data = require(p);
          const list = Array.isArray(data) ? data : Object.values(data).flat();
          const found = list.find(
            (c) =>
              c &&
              String(c.id).toLowerCase() === String(cardIdInput).toLowerCase()
          );
          if (found) {
            cardObj = found;
            sourceFile = file;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      let gross = 0;
      let priceSource = "estimated";

      if (cardObj && cardObj.price) {
        if (typeof cardObj.price === "number") {
          gross = cardObj.price;
          priceSource = "listed";
        } else if (typeof cardObj.price === "string") {
          const m = String(cardObj.price).match(/[\d,]+/);
          if (m) {
            gross = parseInt(m[0].replace(/,/g, ""), 10) || 0;
            priceSource = "listed";
          }
        }
      }

      if (!gross) {
        const overall =
          cardObj && cardObj.overall ? Number(cardObj.overall) : 85;
        gross = Math.max(1000, Math.floor(overall * 1000));
        priceSource = "estimated";
      }

      const taxRate = 0.4;
      const tax = Math.floor(gross * taxRate);
      const net = Math.max(0, gross - tax);

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Sell Preview")
        .setDescription(
          `> ${general.emptyLine}\n` +
            `> ${cardObj?.cardEmoji || ""} **${
              cardObj?.name || cardIdInput
            }** (\`${cardObj?.id || cardIdInput}\`)\n` +
            `> ${general.emptyLine}\n` +
            `> Gross Price (${priceSource}): **${gross.toLocaleString()} MT**\n` +
            `> Marketplace Fee (35%): **-${tax.toLocaleString()} MT**\n` +
            `> VIP Marketplace Fee (25%): **-${Math.floor(
              gross * 0.25
            ).toLocaleString()} MT**\n` +
            `> Net Received: **${net.toLocaleString()} MT**\n` +
            `> ${general.emptyLine}\n` +
            `> Note: If a card has a listed price that is a string it will be parsed; otherwise an estimate based on overall is used.`
        )
        .setFooter({
          text: "NBA Vault • Sell Preview",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in sellpreview command:", error);
      return message.reply(
        "❌ There was an error generating the sell preview."
      );
    }
  },
};
