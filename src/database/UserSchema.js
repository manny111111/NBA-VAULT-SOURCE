const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, unique: true },
    username: String,
    mt: { type: Number, default: 0 },
    vc: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    cards: [{ type: String }],
    packs: [{ type: String }],
    lastDaily: { type: Date, default: null },
    lastBattle: { type: Date, default: null },
    level: { type: Number, default: 1 },
    prestige: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    packHistory: {
      type: [
        new mongoose.Schema(
          {
            pack: { type: String },
            boughtAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
