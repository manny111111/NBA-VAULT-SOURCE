const mongoose = require("mongoose");

const tradeItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["card", "pack", "mt", "vc"], required: true },
    id: { type: String },
    amount: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const TradeSchema = new mongoose.Schema(
  {
    fromDiscordId: { type: String, required: true },
    toDiscordId: { type: String, required: true },

    give: { type: [tradeItemSchema], default: [] },
    want: { type: [tradeItemSchema], default: [] },

    escrow: {
      locked: { type: Boolean, default: false },
      locks: [
        {
          ownerDiscordId: String,
          itemType: { type: String, enum: ["card", "pack", "mt", "vc"] },
          itemId: String,
          amount: Number,
          reservedAt: Date,
        },
      ],
    },

    status: {
      type: String,
      enum: ["open", "accepted", "completed", "cancelled", "expired"],
      default: "open",
    },

    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },

    notes: { type: String },
  },
  { timestamps: true }
);

TradeSchema.index({ toDiscordId: 1 });
TradeSchema.index({ fromDiscordId: 1 });
TradeSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model("Trade", TradeSchema);
