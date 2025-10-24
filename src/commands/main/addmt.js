/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "addmt",
  description: "DEV ONLY",
  usage: "!addmt <@user> <amount>",
  async execute(message, args) {
    const ownerIds = JSON.parse(process.env.OWNER_IDS || "[]");
    if (!ownerIds.includes(message.author.id)) {
      return message.reply("You do not have permission to use this command.");
    }

    if (args.length < 2) {
      return message.reply("Usage: !addmt <@user> <amount>");
    }

    try {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.reply("Please mention a valid user.");
      }

      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Please provide a valid positive number.");
      }

      let user = await User.findOne({ discordId: targetUser.id });
      if (!user) {
        user = new User({
          discordId: targetUser.id,
          username: targetUser.username,
        });
      }

      user.mt += amount;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`${general.MTP} MT Points Added`)
        .setDescription(
          `
> Added \`${amount.toLocaleString()} MT\` to ${targetUser}
> ${general.emptyLine}
> ${general.MTP} New Balance: \`${user.mt.toLocaleString()} MT\`
`
        )
        .setFooter({
          text: "NBA Vault • Admin",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error adding MT Points!");
    }
  },
};
