const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema({
  type: { type: String, required: true },
  id: { type: mongoose.Schema.Types.Mixed },
  chance: { type: Number },
  amount: { type: [Number] },
});

const PendingBattleSchema = new mongoose.Schema({
  challengerId: { type: String, required: true },
  challengerTeam: { type: [String], required: true },
  defenderId: { type: String, required: true },
  accepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const BattleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  difficulty: { type: String, required: true },
  team: { type: [String], required: true },
  rewards: { type: [RewardSchema], required: true },
  isPvp: { type: Boolean, default: false },
  challenger: { type: String },
  defender: { type: String },
  challengerTeam: { type: [String] },
  defenderTeam: { type: [String] },
});

const Battle = mongoose.model("Battle", BattleSchema);
const PendingBattle = mongoose.model("PendingBattle", PendingBattleSchema);

module.exports = { Battle, PendingBattle };
