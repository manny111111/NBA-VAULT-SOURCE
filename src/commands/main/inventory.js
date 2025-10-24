/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../database/UserSchema");
const { general, gems } = require("../../configs/emojis/main.json");
const gemTiers = require("../../configs/constants/gems");
const packEmojis = require("../../configs/emojis/packs.json");

function resolvePackEmoji(pack) {
  try {
    if (!pack || typeof pack !== "string") return "📦";
    const packsObj = (packEmojis && (packEmojis.packs || packEmojis)) || {};
    const lc = (pack || "").toLowerCase();
    if (packsObj[`${pack}Pack`]) return packsObj[`${pack}Pack`];
    if (packsObj[pack]) return packsObj[pack];
    const key = Object.keys(packsObj).find((k) => {
      const lk = k.toLowerCase();
      return lk === lc || lk === `${lc}pack` || lk.includes(lc);
    });
    if (key) {
      const val = packsObj[key];
      if (typeof val === "string") return val;
      if (val && typeof val === "object")
        return val.emoji || val.packEmoji || Object.values(val)[0];
    }
  } catch (e) {
    // IGNORE!!!
  }
  return "📦";
}

function normalizePackKey(p) {
  if (!p || typeof p !== "string") return null;
  let s = p.replace(/[_\- ]/g, "").toLowerCase();
  s = s.replace(/pack$/i, "");
  if (s === "vaultunlimitedpack") s = "vaultUnlimited";
  if (s === "vaultunlimited") s = "vaultUnlimited";
  if (s === "100ovrpack" || s === "100ovr") s = "100ovr";
  if (s === "throwbackpack" || s === "throwbackpack") s = "throwback";
  return s;
}

function getEmoji(value, fallback) {
  if (!value) return fallback || "❔";
  return value;
}

function prettyPackName(p) {
  if (!p || typeof p !== "string") return p;
  if (p === "vaultUnlimited") return "Vault Unlimited";
  if (p === "100ovr") return "100 OVR";
  const spaced = p
    .replace(/[_\-]/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

module.exports = {
  name: "inventory",
  aliases: ["inv"],
  description: "View your card collection and packs",
  async execute(message, args) {
    try {
      const userId = message.author.id;
      let user = await User.findOne({ discordId: userId });

      if (!user) {
        user = new User({
          discordId: userId,
          username: message.author.username,
        });
        await user.save();
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("inventory_filter")
        .setPlaceholder("Select a card tier")
        .addOptions([
          { label: "All Cards", value: "all", emoji: "🏆" },
          {
            label: "GOAT",
            value: "goats",
            emoji: getEmoji(gems.goatsGem, "🏆"),
          },
          {
            label: "Invincible",
            value: "invincible",
            emoji: getEmoji(gems.invincibleGem, "💠"),
          },
          {
            label: "100 OVR",
            value: "100ovr",
            emoji: getEmoji(gems["100ovrGem"], "🔢"),
          },
          {
            label: "Dark Matter",
            value: "darkMatter",
            emoji: getEmoji(gems.darkMatterGem, "💠"),
          },
          {
            label: "Galaxy Opal",
            value: "galaxyOpal",
            emoji: getEmoji(gems.galaxyOpalGem, "🔮"),
          },
          {
            label: "Pink Diamond",
            value: "pinkDiamond",
            emoji: getEmoji(gems.pinkDiamondGem, "💗"),
          },
          {
            label: "Diamond",
            value: "diamond",
            emoji: getEmoji(gems.diamondGem, "💎"),
          },
          {
            label: "Amethyst",
            value: "amethys",
            emoji: getEmoji(gems.amethystGem, "🟣"),
          },
          {
            label: "Throwback",
            value: "throwback",
            emoji: getEmoji(gems.throwbackGem, "🔥"),
          },
          { label: "Ruby", value: "ruby", emoji: getEmoji(gems.rubyGem, "🔴") },
          {
            label: "Sapphire",
            value: "sapphire",
            emoji: getEmoji(gems.sapphireGem, "🔵"),
          },
          {
            label: "Emerald",
            value: "emerald",
            emoji: getEmoji(gems.emeraldGem, "🟢"),
          },
          {
            label: "Boss Cards",
            value: "boss",
            emoji: "<:BOSS:1416185644811817041>",
          },
          {
            label: "Special Cards",
            value: "special",
            emoji: "<:SPECIAL:1416185646359511171>",
          },
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const packCounts = (user.packs || [])
        .filter((p) => typeof p === "string" && p)
        .reduce((acc, p) => {
          const key = normalizePackKey(p) || p;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      const packList =
        Object.keys(packCounts).length > 0
          ? Object.entries(packCounts)
              .map(
                ([pack, count]) =>
                  `> ${resolvePackEmoji(pack)} **${prettyPackName(
                    pack
                  )}** x${count}`
              )
              .join("\n")
          : "> • No packs";

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${general.MyTEAM} ${message.author.username}'s Inventory`)
        .setDescription(
          `
> ${general.emptyLine}
> ${general.VC} **VC Balance:** \`${(user.vc || 0).toLocaleString()}\`
> ${general.MTP} **MT Points:** \`${(user.mt || 0).toLocaleString()}\`
> ${general.TOKENS} **Tokens:** \`${(user.tokens || 0).toLocaleString()}\`
> ${general.emptyLine}
> **Packs:**
${packList}
> ${general.emptyLine}
> **Cards:** \`${(user.cards || []).length}\` total
> Use the dropdown below to filter cards by tier
`
        )
        .setFooter({
          text: "NBA Vault • Inventory",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error accessing your inventory!");
    }
  },
};
