/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Weekly = require("../../database/WeeklySchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  name: "weekly",
  description: "Claim your weekly reward!",
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

      let weeklyRec = await Weekly.findOne({ discordId: userId });
      if (!weeklyRec) {
        weeklyRec = new Weekly({
          discordId: userId,
          username: message.author.username,
        });
      }

      const lastWeekly = weeklyRec.lastWeekly;
      const now = new Date();
      const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

      if (lastWeekly && now - lastWeekly < WEEK_MS) {
        const timeLeft = WEEK_MS - (now - lastWeekly);
        const days = Math.floor(timeLeft / (24 * 3600000));
        const hours = Math.floor((timeLeft % (24 * 3600000)) / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);

        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle(`${general.loading} Weekly Reward`)
          .setDescription(
            `> You need to wait **${days}d ${hours}h ${minutes}m** before claiming again!`
          )
          .setFooter({
            text: "NBA Vault • Weekly Rewards",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      const vcReward = Math.floor(
        Math.random() * (250000 - 100000 + 1) + 100000
      );
      user.vc = (user.vc || 0) + vcReward;
      weeklyRec.lastWeekly = now;

      await user.save();
      await weeklyRec.save();

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`${general.MyTEAM} Weekly Reward`)
        .setDescription(
          `\n> - ${
            general.VC
          } **VC Reward:** \`${vcReward.toLocaleString()}\`\n> ${
            general.emptyLine
          }\n> - ${general.MyTEAM} **Current Balance:**\n> - ${
            general.VC
          } VC: \`${user.vc.toLocaleString()}\`\n`
        )
        .setFooter({
          text: "NBA Vault • Weekly Rewards",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error processing your weekly reward!");
    }
  },
};
