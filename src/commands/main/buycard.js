/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Shop = require("../../database/ShopSchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "buycard",
  description: "Buy a card from the shop using MT Points",
  usage: "!buycard <cardId>",
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        "Please provide the card ID you want to buy. Use !shop cards to see available cards."
      );
    }

    try {
      const cardId = args[0].toLowerCase();
      const userId = message.author.id;

      const [shop, user] = await Promise.all([
        Shop.findOne(),
        User.findOne({ discordId: userId }),
      ]);

      if (!shop) {
        return message.reply(
          "Shop is currently unavailable. Please try again later."
        );
      }

      if (!user) {
        return message.reply(
          "You need to create an account first. Use !daily to start!"
        );
      }

      let foundCard = null;
      let cardTier = null;

      for (const [tier, cards] of Object.entries(shop.cards)) {
        const card = cards.find((c) => c.id.toLowerCase() === cardId);
        if (card) {
          foundCard = card;
          cardTier = tier;
          break;
        }
      }

      if (!foundCard) {
        return message.reply(
          "Card not found in the shop. Use !shop cards to see available cards."
        );
      }

      const priceString = foundCard.price.split(" ")[0].replace(/,/g, "");
      const price = parseInt(priceString);

      if (user.mt < price) {
        return message.reply(
          `You don't have enough MT Points. You need ${price.toLocaleString()} MT.`
        );
      }

      user.mt -= price;
      user.cards.push(foundCard.id);
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`${general.MyTEAM} Card Purchased`)
        .setDescription(
          `
> ${foundCard.cardEmoji} **${foundCard.name}**
> ${general.emptyLine}
> ${general.MTP} Price: \`${foundCard.price}\`
> ${general.MTP} Remaining MT: \`${user.mt.toLocaleString()}\`
`
        )
        .setFooter({
          text: "NBA Vault • Shop",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error processing your purchase!");
    }
  },
};
