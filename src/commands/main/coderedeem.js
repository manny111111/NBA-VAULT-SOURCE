/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Code = require("../../database/CodeSchema");
const User = require("../../database/UserSchema");
const { EmbedBuilder } = require("discord.js");
const { general } = require("../../configs/emojis/main.json");
const packs = require("../../configs/emojis/packs.json");

module.exports = {
  name: "coderedeem",
  description: "Redeem a code for rewards",
  usage: "!coderedeem <code>",
  async execute(message, args) {
    if (!args[0]) {
      return message.reply("❌ Please provide a code to redeem!");
    }

    const code = args[0].toUpperCase();

    try {
      const codeDoc = await Code.findOne({ code });
      if (!codeDoc) {
        return message.reply("❌ Invalid code!");
      }

      if (codeDoc.expiresAt && codeDoc.expiresAt < new Date()) {
        await Code.deleteOne({ code });
        return message.reply("❌ This code has expired!");
      }

      if (
        codeDoc.vipOnly &&
        !message.member?.roles?.cache?.has(process.env.VIP_ROLE_ID)
      ) {
        return message.reply(
          "❌ This code can only be redeemed by VIP members!"
        );
      }

      if (codeDoc.usedBy.includes(message.author.id)) {
        return message.reply("❌ You have already redeemed this code!");
      }

      const user = await User.findOne({ discordId: message.author.id });
      if (!user) {
        return message.reply(
          "❌ You need to create an account first! Use !daily to start."
        );
      }

      let rewardText = "";

      if (codeDoc.type === "bundle" && Array.isArray(codeDoc.rewards)) {
        for (const reward of codeDoc.rewards) {
          if (reward.type === "mt") {
            user.mt = (user.mt || 0) + reward.amount;
            rewardText += `\n${
              general.MTP
            } MT: ${reward.amount.toLocaleString()}`;
          } else if (reward.type === "vc") {
            user.vc = (user.vc || 0) + reward.amount;
            rewardText += `\n${
              general.VC
            } VC: ${reward.amount.toLocaleString()}`;
          } else if (reward.type === "pack") {
            user.packs = user.packs || [];
            user.packs.push(reward.itemId);
            const packEmoji = packs.packs[`${reward.itemId}Pack`] || "📦";
            rewardText += `\n${packEmoji} Pack: ${reward.itemId}`;
          } else if (reward.type === "card") {
            user.cards = user.cards || [];
            if (!user.cards.includes(reward.itemId)) {
              user.cards.push(reward.itemId);
            }
            rewardText += `\n🃏 Card: ${reward.itemId}`;
          }
        }
      } else {
        if (codeDoc.type === "mt") {
          user.mt = (user.mt || 0) + codeDoc.amount;
          rewardText = `${
            general.MTP
          } **MT:** ${codeDoc.amount.toLocaleString()}`;
        } else if (codeDoc.type === "vc") {
          user.vc = (user.vc || 0) + codeDoc.amount;
          rewardText = `${
            general.VC
          } **VC:** ${codeDoc.amount.toLocaleString()}`;
        } else if (codeDoc.type === "pack") {
          user.packs = user.packs || [];
          user.packs.push(codeDoc.itemId);
          const packEmoji = packs.packs[`${codeDoc.itemId}Pack`] || "📦";
          rewardText = `${packEmoji} **Pack:** ${codeDoc.itemId}`;
        } else if (codeDoc.type === "card") {
          user.cards = user.cards || [];
          if (!user.cards.includes(codeDoc.itemId)) {
            user.cards.push(codeDoc.itemId);
          }
          rewardText = `🃏 **Card:** ${codeDoc.itemId}`;
        }
      }

      codeDoc.usedBy.push(message.author.id);
      await codeDoc.save();
      await user.save();

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Code Redeemed")
        .setDescription(rewardText)
        .setFooter({
          text: `Code: ${code}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in coderedeem command:", error);
      return message.reply("❌ There was an error redeeming this code!");
    }
  },
};
