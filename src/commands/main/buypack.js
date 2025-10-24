/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const User = require("../../database/UserSchema");
const Shop = require("../../database/ShopSchema");
const { general } = require("../../configs/emojis/main.json");
const { packs: packEmojis } = require("../../configs/emojis/packs.json");

module.exports = {
  name: "buypack",
  description: "Buy a pack from the shop using VC",
  usage: "!buypack <packType>",
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        "Please provide the pack name you want to buy. Use !shop packs to see available packs."
      );
    }

    try {
      const inputPackName = args[0].toLowerCase();
      const userId = message.author.id;

      const packMappings = {
        base: "base",
        basic: "base",
        regular: "base",
        normal: "base",
        b: "base",

        deluxe: "deluxe",
        delux: "deluxe",
        dlx: "deluxe",
        d: "deluxe",

        superdeluxe: "superDeluxe",
        "super deluxe": "superDeluxe",
        super: "superDeluxe",
        sd: "superDeluxe",

        darkmatter: "darkMatter",
        "dark matter": "darkMatter",
        dark: "darkMatter",
        dm: "darkMatter",

        galaxyopal: "galaxyOpal",
        "galaxy opal": "galaxyOpal",
        galaxy: "galaxyOpal",
        opal: "galaxyOpal",
        go: "galaxyOpal",

        goat: "goats",
        goats: "goats",
        g: "goats",

        invincible: "invincible",
        inv: "invincible",
        i: "invincible",

        "100ovr": "100ovr",
        100: "100ovr",
        ovr: "100ovr",
        "100 ovr": "100ovr",

        vaultunlimited: "vaultUnlimited",
        "vault unlimited": "vaultUnlimited",
        vault: "vaultUnlimited",
        unlimited: "vaultUnlimited",
        vu: "vaultUnlimited",
      };

      const packName = packMappings[inputPackName] || inputPackName;

      const [shop, user] = await Promise.all([
        Shop.findOne(),
        User.findOne({ discordId: userId }),
      ]);

      if (!shop) {
        return message.reply(
          "Shop is currently unavailable. Please try again later."
        );
      }

      if (!user) {
        return message.reply(
          "You need to create an account first. Use !daily to start!"
        );
      }

      const resolvePack = (packsObj, lookup) => {
        if (!packsObj || !lookup) return null;
        if (packsObj[lookup]) return packsObj[lookup];
        const lc = String(lookup).toLowerCase();
        const keyCi = Object.keys(packsObj).find(
          (k) => String(k).toLowerCase() === lc
        );
        if (keyCi) return packsObj[keyCi];
        const byName = Object.values(packsObj).find(
          (p) => p && String(p.name).toLowerCase() === lc
        );
        if (byName) return byName;
        const normalize = (s) =>
          String(s || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .replace(/pack$/, "");
        const targetNorm = normalize(lookup);
        const keyNorm = Object.keys(packsObj).find(
          (k) =>
            normalize(k) === targetNorm ||
            normalize(packsObj[k]?.name) === targetNorm
        );
        if (keyNorm) return packsObj[keyNorm];
        return null;
      };

      let pack = resolvePack(shop.packs || {}, packName);

      if (!pack) {
        try {
          const tbCfg = require("../../configs/packs/throwback.json");
          const key = Object.keys(tbCfg).find((k) =>
            k.toLowerCase().includes("throwback")
          );
          const settings =
            (tbCfg &&
              (tbCfg[key] ||
                tbCfg.throwbackSettings ||
                tbCfg.throwbackPackConfig)) ||
            null;
          if (settings) {
            let price = 0;
            if (settings.throwbackPrice) {
              price =
                parseInt(
                  String(settings.throwbackPrice).replace(/[,\s]/g, "")
                ) || 0;
            } else if (settings.priceSetting) {
              price =
                parseInt(String(settings.priceSetting).replace(/[,\s]/g, "")) ||
                0;
            }
            pack = {
              name: "throwback",
              price: price,
              emoji:
                (packEmojis &&
                  (packEmojis.throwbackPack || packEmojis.throwback)) ||
                "<:throwback_gem:1420388930368442439>",
            };
          }
        } catch (e) {
          // ignore
        }
      }

      if (!pack) {
        return message.reply(
          "Pack not found in the shop. Use !shop packs to see available packs."
        );
      }

      const parsePrice = (p) => {
        if (typeof p === "number") return p;
        if (!p) return 0;
        const n = parseInt(String(p).replace(/[^0-9]/g, ""), 10);
        return Number.isNaN(n) ? 0 : n;
      };

      const price = parsePrice(pack.price);
      if (price <= 0) {
        return message.reply("This pack has an invalid price configured.");
      }

      if ((user.vc || 0) < price) {
        return message.reply(
          `You don't have enough VC. You need ${price.toLocaleString()} VC.`
        );
      }

      const WINDOW_MS = 60 * 60 * 1000;
      const PRUNE_MS = 24 * 60 * 60 * 1000;
      user.packHistory = Array.isArray(user.packHistory)
        ? user.packHistory
        : [];

      const pruneBefore = Date.now() - PRUNE_MS;
      user.packHistory = user.packHistory.filter((h) => {
        const t = new Date(h?.boughtAt).getTime();
        return !isNaN(t) && t >= pruneBefore;
      });

      const windowStart = Date.now() - WINDOW_MS;
      const recentCount = user.packHistory.filter(
        (h) =>
          h.pack === packName && new Date(h.boughtAt).getTime() >= windowStart
      ).length;

      const maxPacksAllowed = 5;
      if (recentCount >= maxPacksAllowed) {
        return message.reply(
          `You have reached the hourly limit of ${maxPacksAllowed} purchases for this pack type. Try again later.`
        );
      }

      user.vc = (user.vc || 0) - price;
      user.packs = Array.isArray(user.packs) ? user.packs : [];
      user.packs.push(packName);
      user.packHistory.push({
        pack: packName,
        boughtAt: new Date().toISOString(),
      });
      await user.save();

      const remainingAfter = Math.max(0, maxPacksAllowed - (recentCount + 1));

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`${general.MyTEAM} Pack Purchased`)
        .setDescription(
          `\n> ${pack.emoji} **${
            pack.name.charAt(0).toUpperCase() + pack.name.slice(1)
          } Pack**\n> ${general.emptyLine}\n> ${
            general.VC
          } Price: \`${price.toLocaleString()} VC\`\n> ${
            general.VC
          } Remaining VC: \`${user.vc.toLocaleString()}\`\n> You can buy ${remainingAfter} more packs till the limit resets.\n> You can buy more packs in 1 hour!`
        )
        .setFooter({
          text: "NBA Vault • Shop",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply("There was an error processing your purchase!");
    }
  },
};
