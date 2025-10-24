/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Code = require("../../database/CodeSchema");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");
const { parseDuration } = require("../../utils/eventUtils");

module.exports = {
  name: "codeadd",
  description: "DEV ONLY",
  usage:
    "!codeadd <code> <type:card/pack/mt/vc/bundle> <itemId|amount|rewards> <duration>",
  async execute(message, args) {
    const ownerIds = JSON.parse(process.env.OWNER_IDS);
    if (!ownerIds.includes(message.author.id)) {
      return message.reply(
        "❌ You do not have permission to use this command!"
      );
    }

    if (args.length < 3) {
      const usageEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("❌ Invalid Usage")
        .setDescription(
          "### Command Format\n`!codeadd <code> <type> <rewards> <duration>`"
        )
        .addFields(
          {
            name: "📋 Types",
            value: "`card` • `pack` • `mt` • `vc` • `bundle`",
            inline: false,
          },
          {
            name: "🎁 Examples",
            value:
              "```!codeadd WELCOME2025 mt 10000 7d\n!codeadd STARTER pack superDeluxe 24h\n!codeadd MEGA bundle mt:5000,vc:2000,pack:throwback 14d```",
            inline: false,
          },
          {
            name: "⏱️ Duration",
            value: "Use format: `7d`, `24h`, `30m`",
            inline: false,
          }
        )
        .setFooter({ text: "Developer Command" })
        .setTimestamp();

      return message.reply({ embeds: [usageEmbed] });
    }

    const [code, typeRaw] = args;
    let remaining = args.slice(2);
    const type = String(typeRaw).toLowerCase();

    if (!["card", "pack", "mt", "vc", "bundle"].includes(type)) {
      return message.reply(
        "❌ Type must be one of: `card`, `pack`, `mt`, `vc`, `bundle`"
      );
    }

    try {
      let itemId = null;
      let amount = null;
      let rewards = [];

      let duration = null;
      let durationIndex = -1;
      for (let i = 0; i < remaining.length; i++) {
        try {
          if (parseDuration(remaining[i]) > 0) {
            duration = remaining[i];
            durationIndex = i;
            break;
          }
        } catch (e) {}
      }

      if (durationIndex === -1 && remaining.length > 0) {
        const maybe = remaining[remaining.length - 1];
        try {
          if (parseDuration(maybe) > 0) {
            duration = maybe;
            durationIndex = remaining.length - 1;
          }
        } catch (e) {}
      }

      const rewardTokens = remaining.filter((_, idx) => idx !== durationIndex);

      if (type === "mt" || type === "vc") {
        const token = rewardTokens[0];
        const n = parseInt(String(token || "").replace(/[^0-9]/g, ""), 10);
        if (Number.isNaN(n) || n <= 0) {
          return message.reply(
            "❌ For MT/VC codes, provide a positive numeric amount"
          );
        }
        amount = n;
      } else if (
        type === "bundle" ||
        rewardTokens.length > 1 ||
        (rewardTokens.length === 1 && rewardTokens[0].includes(":"))
      ) {
        const combined = rewardTokens.join(" ");
        const parts = combined
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        for (const part of parts) {
          const m = part.match(/^([a-zA-Z]+)[:\s](.+)$/);
          if (!m) continue;
          const rtype = m[1].toLowerCase();
          const rval = m[2].trim();

          if (rtype === "mt" || rtype === "vc") {
            const n = parseInt(String(rval).replace(/[^0-9]/g, ""), 10);
            if (Number.isNaN(n) || n <= 0) continue;
            rewards.push({ type: rtype, amount: n });
          } else if (rtype === "pack" || rtype === "card") {
            rewards.push({ type: rtype, itemId: rval });
          }
        }

        if (!rewards.length) {
          return message.reply(
            "❌ No valid rewards parsed for bundle. Use format: `mt:1000,vc:500,pack:starter`"
          );
        }
      } else {
        const token = rewardTokens[0];
        if (!token) {
          return message.reply("❌ Provide an itemId for card/pack codes");
        }
        itemId = token;
      }

      if (!duration) {
        return message.reply("❌ Provide a duration (e.g. `7d`, `24h`, `30m`)");
      }

      const durationMs = parseDuration(duration);
      const expiresAt = new Date(Date.now() + durationMs);
      const codeType = rewards.length ? "bundle" : type;

      const newCode = new Code({
        code,
        type: codeType,
        itemId,
        amount,
        rewards,
        duration,
        expiresAt,
        usedBy: [],
      });

      await newCode.save();

      const formatRewards = () => {
        if (codeType === "mt")
          return `${general.MTP} **${amount.toLocaleString()}** MT`;
        if (codeType === "vc")
          return `${general.VC} **${amount.toLocaleString()}** VC`;
        if (codeType === "card") return `🃏 Card: \`${itemId}\``;
        if (codeType === "pack") return `📦 Pack: \`${itemId}\``;
        if (codeType === "bundle") {
          return rewards
            .map((r) => {
              if (r.type === "mt")
                return `${general.MTP} ${r.amount.toLocaleString()} MT`;
              if (r.type === "vc")
                return `${general.VC} ${r.amount.toLocaleString()} VC`;
              if (r.type === "pack") return `📦 ${r.itemId}`;
              if (r.type === "card") return `🃏 ${r.itemId}`;
              return r.type;
            })
            .join("\n");
        }
        return "Unknown";
      };

      const successEmbed = new EmbedBuilder()
        .setColor("#2ecc71")
        .setTitle("✅ Code Created Successfully")
        .setDescription(`### Code: \`${code}\``)
        .addFields(
          {
            name: "🏷️ Type",
            value: `\`${codeType.toUpperCase()}\``,
            inline: true,
          },
          { name: "⏱️ Duration", value: `\`${duration}\``, inline: true },
          {
            name: "📅 Expires",
            value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
            inline: true,
          },
          { name: "🎁 Rewards", value: formatRewards(), inline: false }
        )
        .setFooter({
          text: `Created by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error in codeadd command:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("❌ Error Creating Code")
        .setDescription("An unexpected error occurred while creating the code.")
        .addFields({
          name: "🔍 Error Details",
          value: `\`\`\`${error.message}\`\`\``,
          inline: false,
        })
        .setFooter({ text: "Check console for full error log" })
        .setTimestamp();

      return message.reply({ embeds: [errorEmbed] });
    }
  },
};
