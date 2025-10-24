/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Daily = require("../../database/DailySchema");
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily VC reward!"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const userId = interaction.user.id;
      let user = await User.findOne({ discordId: userId });

      if (!user) {
        user = new User({
          discordId: userId,
          username: interaction.user.username,
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
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
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
> ${general.VC} **VC Reward:** \`${vcReward.toLocaleString()}\`
> ${general.emptyLine}
> ${general.MyTEAM} **Current Balance:**
> ${general.VC} VC: \`${user.vc.toLocaleString()}\`
`
        )
        .setFooter({
          text: "NBA Vault • Daily Rewards",
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.editReply(
        "There was an error processing your daily reward!"
      );
    }
  },
};
