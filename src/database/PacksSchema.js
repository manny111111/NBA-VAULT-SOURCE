const mongoose = require("mongoose");

const packSchema = new mongoose.Schema(
  {
    packId: { type: String, required: true, unique: true },
    name: String,
    emoji: String,
    priceVC: Number,
    possibleCards: [{ type: String }],
    packChance: { type: Map, of: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pack", packSchema);
