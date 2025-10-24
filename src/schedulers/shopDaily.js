/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Shop = require("../database/ShopSchema");
const schedule = require("node-schedule");

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function loadCardsFromFiles() {
  try {
    const validCardFiles = {
      emerald: require("../configs/cards/emerald.json").emerald,
      sapphire: require("../configs/cards/sapphire.json").sapphire,
      ruby: require("../configs/cards/ruby.json").ruby,
      amethyst: require("../configs/cards/amethys.json").amethyst,
      diamond: require("../configs/cards/diamond.json").diamond,
      pinkDiamond: require("../configs/cards/pinkDiamond.json").pinkDiamond,
      galaxyOpal: require("../configs/cards/galaxyOpal.json").galaxyOpal,
      darkMatter: require("../configs/cards/darkMatter.json").darkMatter,
      invincible: require("../configs/cards/invincible.json").invincible,
      goats: require("../configs/cards/goats.json").goats,
      "100ovr": require("../configs/cards/100ovr.json")["100ovr"],
    };

    const cards = {};
    for (const [tier, cardArray] of Object.entries(validCardFiles)) {
      if (Array.isArray(cardArray)) {
        cards[tier] = cardArray.filter(
          (card) => card && card.id && card.name && card.cardEmoji && card.price
        );
      }
    }
    return cards;
  } catch (error) {
    console.error("❌ Error loading cards:", error);
    return {};
  }
}

async function loadPacksFromFiles() {
  try {
    const packSettings = {
      base: require("../configs/packs/base.json"),
      deluxe: require("../configs/packs/deluxe.json"),
      superDeluxe: require("../configs/packs/superDeluxe.json"),
      goats: require("../configs/packs/goats.json"),
      invincible: require("../configs/packs/invincible.json"),
      darkMatter: require("../configs/packs/darkMatter.json"),
      galaxyOpal: require("../configs/packs/galaxyOpal.json"),
      "100ovr": require("../configs/packs/100ovr.json"),
      vaultUnlimited: require("../configs/packs/vaultUnlimited.json"),
    };

    const packEmojis = require("../configs/emojis/packs.json").packs;
    const packs = {};

    for (const [packType, settings] of Object.entries(packSettings)) {
      if (settings) {
        let price = 0;
        const settingsKey = `${packType}Settings`;
        const priceKey = `${packType}Price`;

        if (settings[priceKey]) {
          if (typeof settings[priceKey] === "object") {
            const priceStr = settings[priceKey][priceKey];
            price = parseInt(priceStr?.replace(/,/g, "")) || 0;
          } else {
            price = parseInt(settings[priceKey].replace(/,/g, "")) || 0;
          }
        } else if (settings[settingsKey] && settings[settingsKey][priceKey]) {
          price =
            parseInt(settings[settingsKey][priceKey].replace(/,/g, "")) || 0;
        }

        packs[packType] = {
          name: packType,
          price: price,
          emoji: packEmojis[`${packType}Pack`],
        };
      }
    }
    return packs;
  } catch (error) {
    console.error("❌ Error loading packs:", error);
    return {};
  }
}

async function initializeShop() {
  try {
    console.log("🏪 Creating initial shop document...");
    const shop = await Shop.create({
      cards: {},
      packs: {},
      lastUpdated: new Date(),
    });
    return shop;
  } catch (error) {
    console.error("❌ Error initializing shop:", error);
    return null;
  }
}

async function updateShopCards() {
  try {
    let shop = await Shop.findOne();

    if (!shop) {
      shop = await initializeShop();
    }

    const allCards = await loadCardsFromFiles();
    let shopCards = {};
    for (const [tier, cards] of Object.entries(allCards)) {
      if (cards && cards.length > 0) {
        shopCards[tier] = getRandomItems(cards, 1);
      }
    }

    shop.cards = shopCards;
    shop.lastUpdated = new Date();
    await shop.save();
  } catch (error) {
    console.error("❌ Error updating shop cards:", error);
  }
}

async function updateShopPacks() {
  try {
    let shop = await Shop.findOne();

    if (!shop) {
      shop = await initializeShop();
    }

    const allPacks = await loadPacksFromFiles();
    const packTypes = Object.keys(allPacks);
    const selectedTypes = getRandomItems(packTypes, 3);

    shop.packs = {};

    for (const type of selectedTypes) {
      if (allPacks[type]) {
        shop.set(`packs.${type}`, {
          name: type,
          price: allPacks[type].price,
          emoji: allPacks[type].emoji,
        });
      }
    }

    shop.lastUpdated = new Date();
    await shop.save();
  } catch (error) {
    console.error("❌ Error updating shop packs:", error);
  }
}

(async () => {
  console.log("🚀 Running initial shop setup...");
  try {
    let shop = await Shop.findOne();
    if (!shop) {
      shop = await initializeShop();
    }
    await Promise.all([updateShopCards(), updateShopPacks()]);
    console.log("✅ Initial shop setup complete");
  } catch (error) {
    console.error("❌ Error during initial setup:", error);
  }
})();

schedule.scheduleJob("0 0 * * *", async () => {
  await updateShopCards();
});

schedule.scheduleJob("0 * * * *", async () => {
  await updateShopPacks();
});

module.exports = {
  updateShopCards,
  updateShopPacks,
};
