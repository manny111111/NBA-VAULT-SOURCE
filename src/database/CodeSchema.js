const mongoose = require("mongoose");

const rewardEntry = new mongoose.Schema(
  {
    type: { type: String, enum: ["card", "pack", "mt", "vc"], required: true },
    itemId: { type: String },
    amount: { type: Number },
  },
  { _id: false }
);

const CodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["card", "pack", "mt", "vc", "bundle", "vip"],
      required: true,
    },
    vipOnly: { type: Boolean, default: false },
    itemId: { type: String },
    amount: { type: Number },
    rewards: { type: [rewardEntry], default: [] },
    duration: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedBy: [{ type: String }],
  },
  { timestamps: true }
);

CodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CodeSchema.index({ code: 1 }, { unique: true });

mongoose.connection.once("connected", async () => {
  try {
    await mongoose.model("Code", CodeSchema).createIndexes();
    console.log("Indexes synced.");
  } catch (err) {
    console.error("Error creating indexes:", err);
  }
});

module.exports = mongoose.model("Code", CodeSchema);
