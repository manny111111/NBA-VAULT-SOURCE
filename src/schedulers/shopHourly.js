/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Shop = require("../database/ShopSchema");
const { updateShopPacks } = require("./shopDaily");
const schedule = require("node-schedule");
const User = require("../database/UserSchema");

schedule.scheduleJob("0 * * * *", async () => {
  console.log("🕒 Running hourly shop pack update...");
  await updateShopPacks();

  try {
    console.log("🧹 Clearing user packHistory for hourly reset...");
    await User.updateMany({}, { $set: { packHistory: [] } });
    console.log("✅ packHistory cleared for all users.");
  } catch (e) {
    console.error("Failed to clear packHistory during hourly reset", e);
  }
});

module.exports = {
  schedule,
};
