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
const { general } = require("../../configs/emojis/main.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your current balance"),

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
        await user.save();
      }

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${general.NBA2K} Balance Info`)
        .setDescription(
          `
> ${general.emptyLine}
> ${general.VC} **VC Balance:** \`${user.vc.toLocaleString()}\`
> ${general.MTP} **MT Points:** \`${user.mt.toLocaleString()}\`
> ${general.TOKENS} **Tokens:** \`${user.tokens.toLocaleString()}\`
> ${general.emptyLine}
> ${general.MyTEAM} **Level:** \`${user.level}\`
> ${general.MyNBA} **Prestige:** \`${user.prestige}\`
`
        )
        .setFooter({
          text: "NBA Vault • Balance",
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.editReply("There was an error checking your balance!");
    }
  },
};
