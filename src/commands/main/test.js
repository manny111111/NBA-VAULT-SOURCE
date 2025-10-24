// ignore or keep

/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */







const sendCardEmbed = require("../../configs/embeds/packEmbeds");
const cards100 = require("../../configs/cards/100ovr.json");
const goats = require("../../configs/cards/goats.json");
const invincible = require("../../configs/cards/invincible.json");
const darkMatter = require("../../configs/cards/darkMatter.json");
const galaxyOpal = require("../../configs/cards/galaxyOpal.json");
const pinkdiamond = require("../../configs/cards/pinkDiamond.json");
const diamond = require("../../configs/cards/diamond.json");
const emojis = require("../../configs/emojis/packs.json");

module.exports = {
  name: "testpack",
  description: "DEV ONLY",
  devOnly: true,
  async execute(message, args, client) {
    if (!process.env.OWNER_IDS.includes(message.author.id))
      return message.reply(
        "❌ You do not have permission to use this command."
      );

    try {
      let packTypeArg = args[0] || "basePack";
      let packType;

      switch (packTypeArg.toLowerCase()) {
        case "100ovr":
        case "100ovrpack":
          packType = "100ovrPack";
          break;
        case "deluxe":
        case "deluxepack":
          packType = "deluxePack";
          break;
        case "goats":
        case "goatspack":
          packType = "goatsPack";
          break;
        case "darkmatter":
        case "darkmatterpack":
          packType = "darkMatterPack";
          break;
        case "invincible":
        case "invinciblepack":
          packType = "invinciblePack";
          break;
        case "pinkdiamond":
        case "pinkdiamondpack":
          packType = "superDeluxePack";
          break;
        case "galaxyopal":
        case "galaxyopalpack":
          packType = "galaxyOpalPack";
          break;
        case "superdeluxe":
        case "superdeluxepack":
          packType = "superDeluxePack";
          break;
        case "diamond":
        case "deluxePack":
          packType = "deluxePack";
          break;
        case "vault":
        case "vaultunlimited":
        case "vaultunlimitedpack":
          packType = "vaultUnlimitedPack";
          break;
        default:
          packType = "basePack";
      }

      if (!emojis.packs[packType])
        return message.reply(`❌ Pack type "${packTypeArg}" does not exist!`);

      let cardArray;
      if (packType === "100ovrPack") {
        cardArray = cards100["100ovr"];
      } else if (packType === "goatsPack") {
        cardArray = goats["goats"];
      } else if (packType === "invinciblePack") {
        cardArray = invincible["invincible"];
      } else if (packType === "darkMatterPack") {
        cardArray = darkMatter["darkMatter"];
      } else if (packType === "galaxyOpalPack") {
        cardArray = galaxyOpal["galaxyOpal"];
      } else if (packType === "superDeluxePack") {
        cardArray = pinkdiamond["pinkDiamond"];
      } else if (packType === "deluxePack") {
        cardArray = diamond["diamond"];
      } else {
        return message.reply(
          `❌ Pack type "${packTypeArg}" not yet supported with cards!`
        );
      }

      if (!cardArray || !cardArray.length)
        return message.reply("❌ No cards found for this pack!");

      const totalWeight = cardArray.reduce(
        (sum, card) => sum + parseFloat(card.packChance),
        0
      );
      let randomNum = Math.random() * totalWeight;
      let cardData;

      for (const card of cardArray) {
        randomNum -= parseFloat(card.packChance);
        if (randomNum <= 0) {
          cardData = card;
          break;
        }
      }
      if (!cardData) cardData = cardArray[cardArray.length - 1];

      await sendCardEmbed(message, cardData, packType);
    } catch (err) {
      console.error("❌ Error in testpack command:", err);
      message.reply("❌ Something went wrong opening the pack!");
    }
  },
};
