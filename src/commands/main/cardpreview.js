/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const path = require("path");
const { general } = require("../../configs/emojis/main.json");
const fs = require("fs");

function pickThumbnail(card) {
  return (
    card.embedThumbnail ||
    card.embedthumbnail ||
    card.image ||
    card.thumbnail ||
    card.cardImage ||
    card.imageUrl ||
    null
  );
}

function getTierColor(tier) {
  const t = String(tier).toLowerCase();
  if (t.includes("dark matter") || t.includes("dm") || t.includes("100"))
    return "#9b59b6";
  if (t.includes("galaxy opal") || t.includes("go") || t.includes("99"))
    return "#e91e63";
  if (t.includes("pink diamond") || t.includes("pd") || t.includes("98"))
    return "#ff1493";
  if (t.includes("diamond") || t.includes("97")) return "#3498db";
  if (t.includes("amethyst") || t.includes("96")) return "#9c27b0";
  if (t.includes("ruby") || t.includes("95")) return "#e74c3c";
  if (t.includes("sapphire") || t.includes("94")) return "#3498db";
  if (t.includes("emerald") || t.includes("93")) return "#2ecc71";
  if (t.includes("gold") || t.includes("92")) return "#f39c12";
  if (t.includes("silver")) return "#95a5a6";
  if (t.includes("bronze")) return "#cd7f32";
  return "#34495e";
}

module.exports = {
  name: "cardpreview",
  description: "Show details for a card by ID",
  usage: "!cardpreview <cardId|emoji>",
  async execute(message, args) {
    if (!args[0]) return message.reply("❌ Provide a card ID to preview");

    const query = String(args.join(" ")).trim();
    const cardsDir = path.join(__dirname, "../../configs/cards");
    const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".json"));

    let found = null;
    for (const file of files) {
      try {
        const p = path.join(cardsDir, file);
        delete require.cache[require.resolve(p)];
        const data = require(p);
        const collections = Array.isArray(data)
          ? data
          : Object.values(data).flat();
        for (const c of collections) {
          if (!c) continue;
          const id = String(c.id || "").toLowerCase();
          const name = String(c.name || "").toLowerCase();
          const emoji = String(c.cardEmoji || "");
          if (
            id === query.toLowerCase() ||
            name === query.toLowerCase() ||
            (query.includes("<:") && emoji.includes(query))
          ) {
            found = c;
            break;
          }
        }
        if (found) break;
      } catch (e) {
        continue;
      }
    }

    if (!found) return message.reply("❌ Card not found in configs.");

    const tier = found.gemTier || found.tier || "Unknown";
    const overall = found.overall || found.rating || "??";
    const id = found.id || "N/A";
    const cardEmoji = found.cardEmoji || "🏀";
    const name = found.name || "Unknown";
    const teamEmoji = found.teamEmoji || "";
    const team = found.team || "";
    const price = found.price || "N/A";
    const confrenceEmoji = found.confrenceEmoji || "";
    const confrence = found.confrence || "";
    const position = found.position || "";
    const thumb = pickThumbnail(found);
    const tierColor = getTierColor(tier);

    const stats = found.stats || {};
    const shooting = stats.shooting || "N/A";
    const dribbling = stats.dribbling || "N/A";
    const passing = stats.passing || "N/A";
    const defense = stats.defense || "N/A";
    const athleticism = stats.athleticism || "N/A";
    const age = found.age || "N/A";
    const weight = found.weight || "N/A";
    const height = found.height || "N/A";
    const packChance = found.packChance || "N/A";

    const description = `# Card Preview\n${tier} ${overall} OVR
${cardEmoji} ${name}
${teamEmoji} ${team}
${general.MTP} ${price}
${confrenceEmoji} ${confrence}

# Stats
**Shooting:** \`${shooting}\`
**Dribbling:** \`${dribbling}\`
**Passing:** \`${passing}\`
**Defense:** \`${defense}\`
**Athleticism:** \`${athleticism}\`
**Age:** \`${age}\`
**Weight:** \`${weight}\`
**Height:** \`${height}\`
**Position:** \`${position}\`
**Card Id:** \`${id}\`
**Pack Chance:** \`${packChance}%\``;

    const embed = new EmbedBuilder()
      .setColor(tierColor)
      .setDescription(description)
      .setThumbnail(thumb || null)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
