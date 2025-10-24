/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder, Collection } = require("discord.js");
const emojies = require("../configs/emojis/main.json");

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (
      message.mentions.has(client.user) &&
      !message.author.bot &&
      !message.content.startsWith(client.config.prefix) &&
      !message.reference &&
      !message.mentions.everyone
    ) {
      try {
        const mentionEmbed = new EmbedBuilder()
          .setColor("#FF6B9D")
          .setTitle("I was mentioned! 🔔")
          .setDescription(
            `**${message.author.username}, Thanks for mentioning me!**\n\n**Hey! ${message.author.tag}, I'm ${client.user.username}, the best NBA ${emojies.general.NBA} card collection and pack opening bot on Discord!**\n\n> - Shop resets daily\n> - Get free packs/VC every day!\n> - Rare cards up for grabs!\n> - Limited-time events and bonuses!\n> - Keep stacking your collection!`
          )
          .setThumbnail(
            client.user.displayAvatarURL({ dynamic: true, size: 256 })
          )
          .setTimestamp()
          .setFooter({
            text: `Mentioned by ${message.author.tag} • Serving ${client.guilds.cache.size} servers`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });

        await message.reply({
          embeds: [mentionEmbed],
        });

        return;
      } catch (error) {
        try {
          await message.reply(
            `👋 Hey ${message.author.username}! I'm ${client.user.username}, your NBA card collection bot!`
          );
        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", fallbackError);
        }
        return;
      }
    }

    if (
      message.content.startsWith(client.config.prefix) &&
      !message.author.bot
    ) {
      const args = message.content
        .slice(client.config.prefix.length)
        .trim()
        .split(/ +/);
      const commandName = args.shift().toLowerCase();

      const command =
        client.commands.get(commandName) ||
        client.commands.find(
          (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        );

      if (!command) {
        return;
      }

      if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
      }

      const now = Date.now();
      const timestamps = client.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(message.author.id)) {
        const expirationTime =
          timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(
            `Please wait ${timeLeft.toFixed(1)} more second(s) before using \`${
              command.name
            }\` again.`
          );
        }
      }

      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
      try {
        await command.execute(message, args, client);
      } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error);
        const errorEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("❌ Command Error")
          .setDescription("There was an error executing this command!")
          .setTimestamp();

        await message.reply({ embeds: [errorEmbed] });
      }
    }
  },
};
