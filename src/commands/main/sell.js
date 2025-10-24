/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const User = require("../../database/UserSchema");
const { EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");

module.exports = {
  name: "sell",
  description: "Sell a card from your collection for MT",
  usage: "!sell <cardId>",
  async execute(message, args) {
    try {
      const cardIdInput = args[0];
      if (!cardIdInput) return message.reply("❌ Usage: !sell <cardId>");
      const discordId = message.author.id;
      const user = await User.findOne({ discordId });
      if (!user)
        return message.reply(
          "❌ You have no account. Use !daily to create one."
        );
      const ownedIndex = (user.cards || []).findIndex(
        (c) => String(c).toLowerCase() === String(cardIdInput).toLowerCase()
      );
      if (ownedIndex === -1)
        return message.reply("❌ You do not own that card.");
      const cardsDir = path.join(__dirname, "../../configs/cards");
      const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));
      let cardObj = null;
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
            break;
          }
        } catch (e) {
          continue;
        }
      }

      let saleMT = 0;
      if (cardObj && cardObj.price && typeof cardObj.price === "string") {
        const m = cardObj.price.match(/[\d,]+/);
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
          cardObj && cardObj.overall ? Number(cardObj.overall) : 85;
        saleMT = Math.max(1000, Math.floor(overall * 1000));
      }

      user.cards.splice(ownedIndex, 1);
      user.mt = (user.mt || 0) + saleMT;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Card Sold")
        .setDescription(
          `> ${cardObj?.cardEmoji || ""} **${
            cardObj?.name || cardIdInput
          }**\n> ✅ Sold for **${saleMT.toLocaleString()}** MT`
        )
        .setFooter({
          text: "NBA Vault • Sell",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in sell command:", error);
      return message.reply("❌ There was an error selling the card.");
    }
  },
};
