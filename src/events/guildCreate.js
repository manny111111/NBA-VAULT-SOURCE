/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const emojis = require("../configs/emojis/main.json");

module.exports = {
  name: "guildCreate",
  async execute(guild, client) {
    console.log(`✅ Joined new guild: ${guild.name} (${guild.id})`);

    let inviteLink = "No invite available";
    try {
      const inviteChannel =
        guild.channels.cache.find(
          (channel) =>
            channel.type === 0 &&
            channel
              .permissionsFor(guild.members.me)
              .has([
                PermissionsBitField.Flags.CreateInstantInvite,
                PermissionsBitField.Flags.ViewChannel,
              ])
        ) || guild.systemChannel;

      if (inviteChannel) {
        const invite = await inviteChannel.createInvite({
          maxAge: 0,
          maxUses: 0,
          unique: true,
          reason: "Bot joined server - creating invite for logs",
        });
        inviteLink = invite.url;
      }
    } catch (error) {
      console.log(
        `Could not create invite for ${guild.name}: ${error.message}`
      );
    }

    const totalUsers = client.guilds.cache.reduce(
      (acc, g) => acc + g.memberCount,
      0
    );
    const logChannel = client.channels.cache.get(client.config.botLogs);

    if (logChannel) {
      const joinEmbed = new EmbedBuilder()
        .setColor("#00FF7F")
        .setTitle("🎉 Successfully Joined New Server!")
        .setDescription(
          `
> **I have been added to a new server!**
> ${emojis.general.emptyLine || ""}
> **[${guild.name}](${inviteLink})** has added me to their server!
                
**📊 Server Information:**
\`\`\`yaml
Server: ${guild.name}
Server ID: ${guild.id}
Owner: ${guild.members.cache.get(guild.ownerId)?.user.tag || "Unknown"}
Owner ID: ${guild.ownerId}
Members: ${guild.memberCount.toLocaleString()}
Created: ${new Date(guild.createdTimestamp).toLocaleDateString()}
Verification: ${guild.verificationLevel}
Boost Level: ${guild.premiumTier}
\`\`\`
                
**🌐 Network Statistics:**
> **Server Members:** \`${guild.memberCount.toLocaleString()}\`
> **Total Servers:** \`${client.guilds.cache.size.toLocaleString()}\`
> **Total Users:** \`${totalUsers.toLocaleString()}\`
> **Shard ID:** \`${guild.shardId || 0}\`
                
**🔗 Quick Access:**
> **Server Link:** [${guild.name}](${inviteLink})
> **Server Icon:** ${
            guild.iconURL()
              ? "[View Icon](" + guild.iconURL({ size: 1024 }) + ")"
              : "No Icon"
          }
> **Vanity URL:** ${
            guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : "None"
          }
                `
        )
        .setThumbnail(
          guild.iconURL({ dynamic: true, size: 256 }) ||
            client.user.displayAvatarURL()
        )
        .setTimestamp()
        .setFooter({
          text: `Guild Join Event • ${guild.name} • Members: ${guild.memberCount} • Total Servers: ${client.guilds.cache.size}`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        });

      if (guild.bannerURL()) {
        joinEmbed.setImage(guild.bannerURL({ size: 1024 }));
      }

      try {
        await logChannel.send({ embeds: [joinEmbed] });
        console.log(
          `✅ Logged guild join for ${guild.name} to BOT_LOGS channel`
        );
      } catch (error) {
        console.error(`❌ Failed to log guild join: ${error.message}`);
      }
    } else {
      console.error("❌ BOT_LOGS channel not found or not accessible");
    }
  },
};
