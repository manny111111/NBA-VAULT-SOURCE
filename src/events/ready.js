/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    const totalUsers = client.guilds.cache.reduce(
      (sum, g) => sum + (g.memberCount || 0),
      0
    );
    console.log(`✅ ${client.user.tag} is online and ready!`);
    console.log(
      `📊 Serving ${totalUsers} users across ${client.guilds.cache.size} guilds`
    );

    client.user.setActivity({
      name: `${client.config.prefix}help`,
      type: ActivityType.Watching,
    });

    setInterval(() => {
      const activities = [
        { name: `${totalUsers} users`, type: ActivityType.Watching },
        { name: "!daily", type: ActivityType.Watching },
        { name: "King Lebron", type: ActivityType.Watching },
        { name: "The best NBA bot", type: ActivityType.Competing },
      ];

      const activity =
        activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(activity);
    }, 30 * 60 * 1000);

    console.log("🎯 Bot is fully operational!");
  },
};
