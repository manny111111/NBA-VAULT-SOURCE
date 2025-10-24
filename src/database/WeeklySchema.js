const mongoose = require("mongoose");

const WeeklySchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String },
  lastWeekly: { type: Date, default: null },
});

module.exports = mongoose.model("Weekly", WeeklySchema);
