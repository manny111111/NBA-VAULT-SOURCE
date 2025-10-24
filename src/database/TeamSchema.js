const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, unique: true },
    cards: [{ type: String, required: true }],
  },
  { timestamps: true }
);

TeamSchema.pre("save", function (next) {
  if (this.cards.length > 4) {
    next(new Error("Team cannot have more than 4 cards"));
  }
  next();
});

module.exports = mongoose.model("Team", TeamSchema);
