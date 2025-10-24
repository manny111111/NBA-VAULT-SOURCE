const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    cards: [
      {
        cardId: { type: String, required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
