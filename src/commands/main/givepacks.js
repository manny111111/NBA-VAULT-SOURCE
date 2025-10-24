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
  name: "givepacks",
  description: "DEV ONLY",
  usage: "!givecard <user> <cardId>",
  async execute(message, args) {
    const ownerIds = JSON.parse(process.env.OWNER_IDS);
    if (!ownerIds.includes(message.author.id)) {
      return message.reply(
        "❌ You do not have permission to use this command!"
      );
    }

    if (args.length < 3) {
      return message.reply("❌ Usage: !givepacks <user> <packType> <amount>");
    }

    const targetUser =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user;
    if (!targetUser) {
      return message.reply("❌ Could not find that user!");
    }

    const packType = args[1].toLowerCase();
    const amount = parseInt(args[2]);

    if (isNaN(amount) || amount < 1) {
      return message.reply("❌ Please provide a valid amount!");
    }

    try {
      const user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        return message.reply("❌ That user does not have an account!");
      }

      for (let i = 0; i < amount; i++) {
        user.packs.push(packType);
      }
      await user.save();

      return message.reply(
        `✅ Successfully gave ${amount}x ${packType} packs to ${targetUser}!`
      );
    } catch (error) {
      console.error("Error in givepacks command:", error);
      return message.reply("❌ There was an error giving the packs!");
    }
  },
};
