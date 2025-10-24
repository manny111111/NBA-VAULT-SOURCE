/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { version } = require("../../../package.json");
const emojis = require("../../configs/emojis/main.json");
const os = require("os");
const moment = require("moment");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Get information about the bot"),
  async execute(interaction, client) {
    const ping = client.ws.ping;
    const cpu = os.cpus()[0];
    const totalusers = client.guilds.cache.reduce(
      (a, b) => a + b.memberCount,
      0
    );
    const totalguilds = client.guilds.cache.size;
    const status = client.presence?.status || "dnd";
    const nodeVersion = process.version;
    const arch = os.arch();
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const botId = client.user.id;
    const botName = client.user.username;
    const botTag = client.user.tag;
    const botCreatedAt = moment(client.user.createdAt).format(
      "MMMM Do YYYY, h:mm:ss a"
    );
    const devs = "manny1_., fuckshai";

    const totalSeconds = Math.floor(client.uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let uptime = [];
    if (days > 0) uptime.push(`${days}d`);
    if (hours > 0) uptime.push(`${hours}h`);
    if (minutes > 0) uptime.push(`${minutes}m`);
    if (seconds > 0) uptime.push(`${seconds}s`);
    const uptimeString = uptime.length > 0 ? uptime.join(" ") : "0s";

    const embed = new EmbedBuilder()
      .setTitle(`${botName} Info`)
      .setColor("Blue")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        `
${emojis.general.bot} **__Bot Information__**
> - **Name:** \`${botName}\`
> - **ID:** \`${botId}\`
> - **Ping:** \`${ping}ms\`
> - **Version:** \`v${version}\`
> - **Tag:** \`${botTag}\`
> - **Total Users:** \`${totalusers}\`
> - **Total Servers:** \`${totalguilds}\`
> - **Status:** \`${status}\`
> - **Created At:** \`${botCreatedAt}\`
> - **Developers:** \`${devs}\`
> - **Uptime:** \`${uptimeString}\`

📂 **__System Information__**
> - **Node.JS Version:** \`${nodeVersion}\`
> - **Architecture:** \`${arch}\`
> - **Memory Usage:** \`${memory} MB\`
> - **CPU:** \`${cpu.model}\`

${emojis.general.externalLink} **__Links__**
> - [Support Server](https://discord.gg/gcV4BAEtJU)
> - [Invite Me](https://discord.com/oauth2/authorize?client_id=1414433675613048832&permissions=2147870785&integration_type=0&scope=bot+applications.commands)
> - [Top.gg](https://top.gg/bot/1414433675613048832)
            `
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
