// ignore... future updates may make use of this file.

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: String,
    active: { type: Boolean, default: true },
    cardMultipliers: { type: Map, of: Number },
    tokenReward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
