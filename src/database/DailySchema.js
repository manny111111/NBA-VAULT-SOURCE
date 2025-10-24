const mongoose = require("mongoose");

const dailySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    lastClaim: { type: Date, default: null },
    rewardVC: { type: Number, default: 0 },
    rewardMT: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Daily", dailySchema);
