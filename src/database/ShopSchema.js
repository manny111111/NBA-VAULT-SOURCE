const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  cardEmoji: String,
  price: String,
  gemTier: String,
});

const packSchema = new mongoose.Schema({
  name: String,
  price: Number,
  emoji: String,
});

const shopSchema = new mongoose.Schema(
  {
    cards: {
      emerald: [cardSchema],
      sapphire: [cardSchema],
      ruby: [cardSchema],
      amethyst: [cardSchema],
      diamond: [cardSchema],
      pinkDiamond: [cardSchema],
      galaxyOpal: [cardSchema],
      darkMatter: [cardSchema],
      invincible: [cardSchema],
      goat: [cardSchema],
    },
    packs: {
      base: packSchema,
      deluxe: packSchema,
      superDeluxe: packSchema,
      goats: packSchema,
      invincible: packSchema,
      darkMatter: packSchema,
      galaxyOpal: packSchema,
      "100ovr": packSchema,
      vaultUnlimited: packSchema,
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema, "shop");
