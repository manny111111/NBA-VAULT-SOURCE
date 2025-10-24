/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const { general, gems } = require("../../configs/emojis/main.json");
const packEmojis = require("../../configs/emojis/packs.json").packs || {};

function normalizePack(input) {
  if (!input) return null;
  let s = String(input)
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  s = s.replace(/pack$/i, "");
  if (s === "vaultunlimited") return "vaultUnlimited";
  if (s === "100ovr") return "100ovr";
  return s;
}

function prettyTier(t) {
  const map = {
    "100ovr": "100 OVR",
    goats: "GOAT",
    amethyst: "Amethyst",
    amethys: "Amethyst",
    diamond: "Diamond",
    ruby: "Ruby",
    sapphire: "Sapphire",
    emerald: "Emerald",
    darkMatter: "Dark Matter",
    pinkDiamond: "Pink Diamond",
    galaxyOpal: "Galaxy Opal",
    invincible: "Invincible",
    throwback: "Throwback",
    throwbacks: "Throwbacks",
  };
  return map[t] || t.charAt(0).toUpperCase() + t.slice(1);
}

function tierGemEmoji(t) {
  if (!t) return "📊";
  if (t === "amethys" || t === "amethyst")
    return gems.amethystGem || packEmojis.amethysPack || "📊";
  if (t === "throwback" || t === "throwbacks")
    return gems.throwbackGem || packEmojis.throwbackPack || "📊";
  if (t === "100ovr")
    return gems["100ovrGem"] || packEmojis["100ovrPack"] || "📊";
  const key = `${t}Gem`;
  return gems[key] || packEmojis[`${t}Pack`] || packEmojis[t] || "📊";
}

module.exports = {
  name: "packpreview",
  description: "Preview what gem tiers a pack contains",
  usage: "!packpreview <packType>",
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        `Please specify a pack to preview. Example: \`!packpreview throwback\``
      );
    }

    const input = args[0];
    const canonical = normalizePack(input);

    let packConfig = null;
    try {
      packConfig = require(`../../configs/packs/${canonical}.json`);
    } catch (e) {
      try {
        packConfig = require(`../../configs/packs/${input}.json`);
      } catch (e2) {
        return message.reply(
          "Pack configuration not found. Make sure the pack type is valid."
        );
      }
    }

    let settings = null;
    const lcPack = String(canonical || input).toLowerCase();
    for (const key of Object.keys(packConfig || {})) {
      const lk = key.toLowerCase();
      if (lk.includes(lcPack) && lk.includes("settings")) {
        settings = packConfig[key];
        break;
      }
    }
    if (!settings) {
      const matchKey = Object.keys(packConfig || {}).find((k) =>
        k.toLowerCase().includes(lcPack)
      );
      if (matchKey) settings = packConfig[matchKey];
    }
    if (!settings) {
      settings =
        packConfig[`${canonical}Settings`] ||
        packConfig[`${canonical}Price`] ||
        packConfig;
    }
    const cardKeyMap = {
      "100ovrCards": "100ovr",
      goatsCards: "goats",
      amethystCards: "amethys",
      diamondCards: "diamond",
      rubyCards: "ruby",
      sapphireCards: "sapphire",
      emeraldCards: "emerald",
      darkMatterCards: "darkMatter",
      pinkDiamondCards: "pinkDiamond",
      galaxyOpalCards: "galaxyOpal",
      invincibleCards: "invincible",
      throwbackCards: "throwback",
      includeThrowbackCards: "throwback",
    };

    const included = new Set();

    if (settings && typeof settings === "object") {
      for (const [k, v] of Object.entries(settings)) {
        if (cardKeyMap[k]) {
          if (v) included.add(cardKeyMap[k]);
        }
        for (const mappedKey of Object.keys(cardKeyMap)) {
          if (k.toLowerCase().includes(mappedKey.replace(/cards$/i, ""))) {
            if (v) included.add(cardKeyMap[mappedKey]);
          }
        }
      }
    }
    if (!included.size) {
      for (const [k, v] of Object.entries(packConfig || {})) {
        if (typeof v === "boolean" && v === true) {
          const lower = k.toLowerCase();
          if (lower.includes("throwback")) included.add("throwback");
          else if (lower.includes("100ovr")) included.add("100ovr");
          else if (lower.includes("goat")) included.add("goats");
          else if (lower.includes("ameth")) included.add("amethys");
          else if (lower.includes("diamond")) included.add("diamond");
          else if (lower.includes("ruby")) included.add("ruby");
          else if (lower.includes("sapphire")) included.add("sapphire");
          else if (lower.includes("emerald")) included.add("emerald");
          else if (lower.includes("dark")) included.add("darkMatter");
          else if (lower.includes("pink")) included.add("pinkDiamond");
          else if (lower.includes("galaxy")) included.add("galaxyOpal");
          else if (lower.includes("invincible")) included.add("invincible");
        }
      }
    }

    if (!included.size && settings && settings.includeThrowbackCards)
      included.add("throwback");

    const tiers = Array.from(included);

    let description = `> ${general.emptyLine}\n`;
    description += `> 📦 **Pack Preview: ${canonical || input}**\n`;
    description += `> ${general.emptyLine}\n`;

    if (!tiers.length) {
      description += `> This pack does not explicitly list card tiers in its config.\n`;
      description += `> Inspect the pack config file if you need exact details.\n`;
    } else {
      description += `> This pack contains the following tiers:\n`;
      for (const t of tiers) {
        const pretty = prettyTier(t);
        const emoji = tierGemEmoji(t);
        description += `> ${emoji} **${pretty}**\n`;
      }
    }

    description += `> ${general.emptyLine}\n`;

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`${general.MyTEAM} Pack Preview`)
      .setDescription(description)
      .setFooter({
        text: "NBA Vault • Pack Preview",
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
