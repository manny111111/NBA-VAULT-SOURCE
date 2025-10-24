/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const User = require("../../database/UserSchema");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "givecard",
  description: "DEV ONLY",
  usage: "!givecard <user> <cardId>",
  async execute(message, args) {
    const ownerIds = JSON.parse(process.env.OWNER_IDS);
    if (!ownerIds.includes(message.author.id)) {
      return message.reply(
        "❌ You do not have permission to use this command!"
      );
    }

    if (args.length < 2) {
      return message.reply("❌ Usage: !givecard <user> <cardId>");
    }

    const targetUser =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user;
    if (!targetUser) {
      return message.reply("❌ Could not find that user!");
    }

    const cardId = args[1];
    try {
      const user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        return message.reply("❌ That user does not have an account!");
      }

      if (!user.cards.includes(cardId)) {
        user.cards.push(cardId);
        await user.save();
      }

      return message.reply(
        `✅ Successfully gave card \`${cardId}\` to ${targetUser}!`
      );
    } catch (error) {
      console.error("Error in givecard command:", error);
      return message.reply("❌ There was an error giving the card!");
    }
  },
};
