const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    cardId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gemTier: { type: String, required: true },
    overall: Number,
    position: String,
    team: String,
    teamEmoji: String,
    confrence: String,
    confrenceEmoji: String,
    cardEmoji: String,
    mtpEmoji: String,
    price: String,
    packChance: Number,
    embedThumbnail: String,
    height: String,
    weight: String,
    age: Number,
    stats: {
      shooting: Number,
      dribbling: Number,
      passing: Number,
      defense: Number,
      athleticism: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
