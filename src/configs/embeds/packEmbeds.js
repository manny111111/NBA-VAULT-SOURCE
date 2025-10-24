/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const packs = require("../../configs/emojis/packs.json");

module.exports = async function cardEmbed(
  message,
  cardData,
  packType = "basePack"
) {
  let packEmoji = "📦";
  try {
    const normalize = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const lcPack = packType || "";
    const lcNorm = normalize(lcPack);

    if (packs && packs.packs && packs.packs[packType]) {
      packEmoji = packs.packs[packType];
    } else if (packs && packs[packType]) {
      packEmoji = packs[packType];
    } else if (packs && packs[`${packType}Pack`]) {
      packEmoji = packs[`${packType}Pack`];
    } else {
      const allKeys = Object.keys(packs || {});
      let matchKey = null;
      for (const k of allKeys) {
        const kNorm = normalize(k);
        if (
          kNorm === lcNorm ||
          kNorm === `${lcNorm}pack` ||
          kNorm.includes(lcNorm) ||
          lcNorm.includes(kNorm)
        ) {
          matchKey = k;
          break;
        }
      }

      if (!matchKey && packs && packs.packs) {
        for (const k of Object.keys(packs.packs)) {
          const kNorm = normalize(k);
          if (
            kNorm === lcNorm ||
            kNorm === `${lcNorm}pack` ||
            kNorm.includes(lcNorm) ||
            lcNorm.includes(kNorm)
          ) {
            matchKey = k;
            break;
          }
        }
      }

      if (matchKey) {
        const val =
          packs[matchKey] !== undefined
            ? packs[matchKey]
            : packs.packs && packs.packs[matchKey];
        if (typeof val === "string") packEmoji = val;
        else if (val && typeof val === "object")
          packEmoji =
            val.emoji || val.packEmoji || Object.values(val)[0] || packEmoji;
      }
    }

    if (packEmoji === "📦") {
      try {
        console.log("[packEmbeds] packEmoji fallback for packType:", packType);
        console.log(
          "[packEmbeds] available pack keys:",
          Object.keys(packs || {}).slice(0, 50)
        );
        if (packs && packs.packs)
          console.log(
            "[packEmbeds] nested packs keys:",
            Object.keys(packs.packs)
          );
      } catch (e) {}
    }
  } catch (e) {
    // IGNORE!!!
  }

  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle(`${packEmoji} Opening Pack...`)
    .setDescription("Preparing your card...")
    .setTimestamp();

  const sentMessage = await message.channel.send({ embeds: [embed] });

  const stats = cardData.stats || {
    shooting: cardData.shooting ?? cardData.shoot ?? "N/A",
    dribbling: cardData.dribbling ?? "N/A",
    passing: cardData.passing ?? "N/A",
    defense: cardData.defense ?? cardData.defence ?? "N/A",
    athleticism: cardData.athleticism ?? "N/A",
  };

  const mainSteps = [
    `${cardData.gemTier || ""} **${cardData.overall}ovr**`,
    `${cardData.teamEmoji || ""} ${cardData.team}`,
    `${cardData.confrenceEmoji || ""} ${cardData.confrence}`,
  ];

  for (let i = 0; i < mainSteps.length; i++) {
    let description = mainSteps.slice(0, i + 1).join("\n");
    if (i === mainSteps.length - 1) {
      const revealTimestamp = Math.floor(Date.now() / 1000) + 5;
      description += `\n\n> Revealing in <t:${revealTimestamp}:R>`;
    }

    embed.setDescription(description);
    await sentMessage.edit({ embeds: [embed] });
    await new Promise((res) => setTimeout(res, 2000));
  }

  await new Promise((res) => setTimeout(res, 5000));

  const fullCard =
    `\n${cardData.cardEmoji || ""} ${cardData.name}\n` +
    `${cardData.mtpEmoji || ""} ${cardData.price}\n\n` +
    `> - Age: \`${cardData.age}\`\n` +
    `> - Shooting: \`${stats.shooting}\`\n` +
    `> - Dribbling: \`${stats.dribbling}\`\n` +
    `> - Passing: \`${stats.passing}\`\n` +
    `> - Defence: \`${stats.defense}\`\n` +
    `> - Athleticism: \`${stats.athleticism}\`\n` +
    `> - Height: \`${cardData.height}\`\n` +
    `> - Position: \`${cardData.position}\`\n` +
    `> - Weight: \`${cardData.weight}\`\n` +
    `> - ID: \`${cardData.id}\`\n` +
    `> - Chance: \`${cardData.packChance || "N/A"}%\``;

  embed
    .setTitle(`You **__PULLED__** A:`)
    .setDescription(mainSteps.join("\n") + fullCard)
    .setThumbnail(cardData.embedThumbnail || "")
    .setFooter({ text: `${cardData.id} | Powered by NBA Vault` });

  await sentMessage.edit({ embeds: [embed] });
};
