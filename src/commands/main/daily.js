/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Daily = require("../../database/DailySchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "daily",
  description: "Claim your daily reward!",
  async execute(message) {
    try {
      const userId = message.author.id;
      let user = await User.findOne({ discordId: userId });

      if (!user) {
        user = new User({
          discordId: userId,
          username: message.author.username,
        });
      }

      const lastDaily = user.lastDaily;
      const now = new Date();

      if (lastDaily && now - lastDaily < 86400000) {
        const timeLeft = 86400000 - (now - lastDaily);
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);

        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle(`${general.loading} Daily Reward`)
          .setDescription(
            `> You need to wait **${hours}h ${minutes}m** before claiming again!`
          )
          .setFooter({
            text: "NBA Vault • Daily Rewards",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      const vcReward = Math.floor(Math.random() * (40000 - 20000 + 1) + 20000);
      user.vc += vcReward;
      user.lastDaily = now;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`${general.MyTEAM} Daily Reward`)
        .setDescription(
          `
> - ${general.VC} **VC Reward:** \`${vcReward.toLocaleString()}\`
> ${general.emptyLine}
> - ${general.MyTEAM} **Current Balance:**
> - ${general.VC} VC: \`${user.vc.toLocaleString()}\`
`
        )
        .setFooter({
          text: "NBA Vault • Daily Rewards",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error processing your daily reward!");
    }
  },
};
