/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Team = require("../../database/TeamSchema");
const User = require("../../database/UserSchema");
const { Battle, PendingBattle } = require("../../database/BattleSchema");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { general, packs } = require("../../configs/emojis/main.json");
const team = require("./team");
const { emojis } = require("../..");
const bossBattles = require("../../configs/cards/bossBattles.json").bossBattles;

async function sendWithTimeout(sendPromise, timeoutMs = 10000) {
  return Promise.race([
    sendPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Embed send timeout")), timeoutMs)
    ),
  ]);
}

const cooldowns = new Map();
const pvpCooldowns = new Map();
const activeBattles = new Map();

const CARD_TIERS = {
  GOAT: 120,
  INVINCIBLE: 105,
  "100OVR": 100,
  DARK_MATTER: 95,
  GALAXY_OPAL: 90,
  PINK_DIAMOND: 85,
  DIAMOND: 80,
  AMETHYST: 75,
  RUBY: 70,
  SAPPHIRE: 65,
  EMERALD: 60,
  THROWBACK: 125,
};

const DIFFICULTY_MULTIPLIERS = {
  Easy: 0.7,
  Medium: 1.1,
  Hard: 1.4,
  Impossible: 2.3,
  Insane: 2.8,
};

const COMMENTARY_TEMPLATES = [
  "{player} drives to the basket... AND SCORES!",
  "{player} pulls up for three... BANG!",
  "{player} with the crossover... gets to the rim... LAYUP GOOD!",
  "{player} with the fadeaway... NOTHING BUT NET!",
  "{player} from downtown... GOT IT!",
  "{player} with the euro step... AND ONE!",
  "{player} throws down the MONSTER JAM!",
  "{player} with the step-back jumper... PERFECT!",
  "{player} splits the defense... WHAT A MOVE!",
  "{player} with the beautiful floater... IT FALLS!",
];

const MISS_COMMENTARY_TEMPLATES = [
  "{player} shoots... BUT IT RIMS OUT!",
  "{player} drives... but the defense holds strong!",
  "{player} with the three attempt... NO GOOD!",
  "{player} tries the fadeaway... MISSES!",
  "{player} can't finish through contact!",
  "{player} gets blocked at the rim!",
  "{player} loses the handle... turnover!",
  "{player} with the jumper... AIRBALL!",
  "{player} can't convert the opportunity!",
];

const DIFFICULTY_MAP = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  impossible: "Impossible",
  insane: "Insane",
};

function determineCardTier(cardId) {
  if (!cardId) throw new Error(`Invalid cardId: ${cardId}`);
  let id = String(cardId).trim();

  if (id.startsWith("<:")) {
    const m = id.match(/^<:([^:>]+):\d+>/);
    if (m && m[1]) {
      const emojiName = m[1].toLowerCase();
      if (emojiName.includes("throwback")) return "throwbacks";
      if (emojiName.includes("goat")) return "goats";
      if (emojiName.includes("invincible")) return "invincible";
      if (emojiName.includes("100ovr")) return "100ovr";
      if (emojiName.includes("dark") || emojiName.includes("dark_matter"))
        return "darkMatter";
      if (
        emojiName.includes("galaxy") ||
        emojiName.includes("galaxyopal") ||
        emojiName.includes("galaxy_opal")
      )
        return "galaxyOpal";
      if (emojiName.includes("pink") || emojiName.includes("pinkdiamond"))
        return "pinkDiamond";
      if (emojiName.includes("diamond")) return "diamond";
      if (emojiName.includes("ameth")) return "amethys";
      if (emojiName.includes("ruby")) return "ruby";
      if (emojiName.includes("sapphire")) return "sapphire";
      if (emojiName.includes("emerald")) return "emerald";
      if (emojiName.includes("boss")) return "bossBattles";
    }
    id = id.replace(/^<:[^:>]+:\d+>\s*/, "");
  }

  if (typeof id === "string" && id.includes("(BOSS)")) {
    return "bossBattles";
  }

  if (typeof id === "string" && id.includes(":")) {
    const lower = id.toLowerCase();
    if (lower.includes("_boss:") || lower.includes("_boss:")) {
      return "bossBattles";
    }
    if (
      lower.includes("_goat:") ||
      lower.includes("_goats:") ||
      lower.includes("_goat:")
    )
      return "goats";
    if (lower.includes("_invincible:") || lower.includes("_invincible:"))
      return "invincible";
    if (lower.includes("_100ovr:") || lower.includes("_100ovr:"))
      return "100ovr";
    if (lower.includes("_dark_matter:") || lower.includes("_dark_matter:"))
      return "darkMatter";
    if (lower.includes("_tb") || lower.includes("_throwback"))
      return "throwbacks";
    if (lower.includes("_galaxy_opal:") || lower.includes("_galaxy_opal:"))
      return "galaxyOpal";
  }

  const tiers = [
    "100ovr",
    "galaxyOpal",
    "pinkDiamond",
    "diamond",
    "amethys",
    "throwbacks",
    "ruby",
    "sapphire",
    "emerald",
    "bossBattles",
    "invincible",
    "goats",
    "darkMatter",
  ];

  const idLower = id.toLowerCase();
  for (const tier of tiers) {
    try {
      const config = require(`../../configs/cards/${tier}.json`);
      const propertyName = getTierPropertyName(tier);
      if (
        config[propertyName]?.some(
          (c) => String(c.id).toLowerCase() === idLower
        )
      ) {
        return tier;
      }
    } catch (error) {
      continue;
    }
  }

  if (id.startsWith("40000")) return "darkMatter";
  if (id.startsWith("60000")) return "galaxyOpal";
  if (id.startsWith("50000")) return "pinkDiamond";
  if (id.startsWith("30000")) return "invincible";
  if (id.startsWith("20000")) return "goats";
  if (id.startsWith("10000")) return "100ovr";
  if (id.startsWith("70000")) return "amethys";
  if (id.startsWith("80000")) return "ruby";
  if (id.startsWith("90000")) return "sapphire";
  if (id.startsWith("95000")) return "emerald";
  if (id.startsWith("boss")) return "bossBattles";

  throw new Error(`Could not determine tier for card ID: ${cardId}`);
}

function getTierPropertyName(tier) {
  switch (tier) {
    case "amethys":
      return "amethyst";
    case "bossBattles":
      return "bossBattles";
    case "special":
      return "100percent";
    case "100ovr":
      return "100ovr";
    case "throwbacks":
      return "throwback";
    default:
      return tier;
  }
}

function getCardInfo(cardId) {
  try {
    if (typeof cardId === "string" && cardId.includes(":")) {
      const [emoji, ...nameParts] = cardId.split(" ");
      const name = nameParts.join(" ");

      if (emoji.includes("_BOSS:") || emoji.includes("_boss:")) {
        return {
          id: cardId,
          name: name,
          cardEmoji: emoji,
          overall: 99,
        };
      }

      return {
        id: cardId,
        name: name,
        cardEmoji: emoji,
        overall: getOverallFromTier(determineCardTier(cardId)),
      };
    }

    const cardTier = determineCardTier(cardId);
    const cardConfig = require(`../../configs/cards/${cardTier}.json`);
    const tierName = getTierPropertyName(cardTier);
    const card = cardConfig[tierName]?.find((c) => c.id === cardId);

    if (!card) {
      throw new Error("Card not found in config");
    }

    return card;
  } catch (error) {
    return null;
  }
}

function getOverallFromTier(tier) {
  switch (tier) {
    case "goats":
      return 105;
    case "invincible":
      return 99;
    case "100ovr":
      return 100;
    case "darkMatter":
      return 99;
    case "galaxyOpal":
      return 97;
    case "pinkDiamond":
      return 95;
    case "diamond":
      return 93;
    case "amethys":
      return 90;
    case "throwbacks":
      return 115;
    case "ruby":
      return 88;
    case "sapphire":
      return 85;
    case "emerald":
      return 82;
    default:
      return 85;
  }
}

async function getPlayerStats(cardId, commentary) {
  const card = getCardInfo(cardId);
  if (!card) return null;

  let points = 0;
  let attempts = 0;
  let makes = 0;
  const cardNameLower = (card.name || "").toLowerCase();

  for (const play of commentary || []) {
    const text = typeof play === "string" ? play : play?.text || "";
    const t = String(text).toLowerCase();
    if (!cardNameLower) continue;
    if (t.includes(cardNameLower)) {
      attempts++;
      const playPoints =
        typeof play === "object" && play.points != null
          ? Number(play.points)
          : null;
      if (playPoints !== null && playPoints > 0) {
        makes++;
        points += playPoints;
      } else if (/scores|bang|good|net|got it|perfect|jam/.test(t)) {
        makes++;
        points += /three|downtown/.test(t) ? 3 : 2;
      }
    }
  }

  return {
    name: card.name,
    emoji: card.cardEmoji || "🏀",
    points,
    fgPercent: attempts > 0 ? Math.round((makes / attempts) * 100) : 0,
  };
}

async function getTeamStats(cardIds, commentary) {
  let stats = "";
  for (const cardId of cardIds) {
    const playerStats = await getPlayerStats(cardId, commentary);
    if (playerStats) {
      stats += `> ${playerStats.emoji} **${playerStats.name}** - ${playerStats.points} PTS (${playerStats.fgPercent}% FG)\n`;
    }
  }
  return stats;
}

async function getBossTeamStats(bossTeam, commentary) {
  let stats = "";
  for (const card of bossTeam) {
    const playerStats = await getPlayerStats(card, commentary);
    if (playerStats) {
      stats += `> ${playerStats.emoji} **${playerStats.name}** - ${playerStats.points} PTS (${playerStats.fgPercent}% FG)\n`;
    }
  }
  return stats;
}

function getCardTier(cardId) {
  const tier = determineCardTier(cardId);
  switch (tier) {
    case "goats":
      return CARD_TIERS.GOAT;
    case "invincible":
      return CARD_TIERS.INVINCIBLE;
    case "100ovr":
      return CARD_TIERS["100OVR"];
    case "darkMatter":
      return CARD_TIERS.DARK_MATTER;
    case "galaxyOpal":
      return CARD_TIERS.GALAXY_OPAL;
    case "pinkDiamond":
      return CARD_TIERS.PINK_DIAMOND;
    case "diamond":
      return CARD_TIERS.DIAMOND;
    case "amethys":
      return CARD_TIERS.AMETHYST;
    case "ruby":
      return CARD_TIERS.RUBY;
    case "sapphire":
      return CARD_TIERS.SAPPHIRE;
    case "emerald":
      return CARD_TIERS.EMERALD;
    default:
      return CARD_TIERS.EMERALD;
  }
}

function calculateTeamRating(cards) {
  return cards.reduce((sum, card) => sum + getCardTier(card), 0) / cards.length;
}

function getRandomCommentary(isScore, cardId) {
  const templates = isScore ? COMMENTARY_TEMPLATES : MISS_COMMENTARY_TEMPLATES;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const card = getCardInfo(cardId);
  if (!card) return template.replace("{player}", cardId);
  return template.replace(
    "{player}",
    `${card.cardEmoji || "🏀"} **${card.name}**`
  );
}

async function simulateGame(team, bossTeam, difficulty) {
  let userRating = calculateTeamRating(team.cards);
  try {
    const hasThrowback = (team.cards || []).some((c) => {
      try {
        return determineCardTier(c) === "throwbacks";
      } catch (e) {
        return false;
      }
    });
    if (hasThrowback) userRating *= 1.08;
  } catch (e) {
    // ignore
  }
  const bossRating =
    calculateTeamRating(bossTeam) * DIFFICULTY_MULTIPLIERS[difficulty];

  let userScore = 0;
  let bossScore = 0;
  const commentary = [];
  const fullCommentary = [];
  let possessionCount = 0;
  const MAX_POSSESSIONS = 100;

  while (
    userScore < 14 &&
    bossScore < 14 &&
    possessionCount < MAX_POSSESSIONS
  ) {
    possessionCount++;

    for (const card of team.cards) {
      if (
        userScore >= 14 ||
        bossScore >= 14 ||
        possessionCount >= MAX_POSSESSIONS
      )
        break;

      const cardInfo = getCardInfo(card);
      const cardOverall = cardInfo?.overall || 85;

      let scoreChance = 0.45;

      if (cardOverall >= 110) scoreChance = 0.68;
      else if (cardOverall >= 105) scoreChance = 0.63;
      else if (cardOverall >= 100) scoreChance = 0.58;
      else if (cardOverall >= 95) scoreChance = 0.53;
      else if (cardOverall >= 90) scoreChance = 0.48;

      const diffMod = DIFFICULTY_MULTIPLIERS[difficulty];
      if (diffMod <= 1.0) scoreChance *= 1.05;
      else if (diffMod <= 1.5) scoreChance *= 0.92;
      else if (diffMod <= 2.0) scoreChance *= 0.78;
      else scoreChance *= 0.65;

      if (userRating > bossRating * 0.85) {
        scoreChance *= 1.08;
      }

      const scored = Math.random() < Math.min(0.8, scoreChance);

      if (scored) {
        const threeChance = cardOverall >= 105 ? 0.35 : 0.22;
        const points = Math.random() < threeChance ? 3 : 2;
        userScore += points;
        const play = getRandomCommentary(true, card);
        commentary.push({ text: play, owner: "user", points });
        fullCommentary.push({ text: play, owner: "user", points });

        if (userScore >= 14) break;
      } else {
        const play = getRandomCommentary(false, card);
        commentary.push({ text: play, owner: "user", points: 0 });
        fullCommentary.push({ text: play, owner: "user", points: 0 });
      }
    }

    if (userScore >= 14 || bossScore >= 14) break;

    for (const card of bossTeam) {
      if (
        userScore >= 14 ||
        bossScore >= 14 ||
        possessionCount >= MAX_POSSESSIONS
      )
        break;

      const cardInfo = getCardInfo(card);
      const cardOverall = cardInfo?.overall || 95;

      let bossScoreChance = 0.4;

      const diffMod = DIFFICULTY_MULTIPLIERS[difficulty];
      if (diffMod <= 1.0) bossScoreChance *= 0.9;
      else if (diffMod <= 1.5) bossScoreChance *= 1.0;
      else if (diffMod <= 2.0) bossScoreChance *= 1.25;
      else bossScoreChance *= 1.45;

      if (cardOverall >= 100) bossScoreChance *= 1.15;
      else if (cardOverall >= 95) bossScoreChance *= 1.08;

      const isBossCard =
        typeof card === "string" &&
        (card.includes("_BOSS:") || card.includes("_boss:"));
      if (isBossCard) bossScoreChance *= 1.12;

      if (userRating > bossRating * 0.7) {
        bossScoreChance *= 0.88;
      }

      const scored = Math.random() < Math.min(0.72, bossScoreChance);

      if (scored) {
        const threeChance = 0.18;
        const points = Math.random() < threeChance ? 3 : 2;
        bossScore += points;
        const play = getRandomCommentary(true, card);
        commentary.push({ text: play, owner: "boss", points });
        fullCommentary.push({ text: play, owner: "boss", points });

        if (bossScore >= 14) break;
      } else {
        const play = getRandomCommentary(false, card);
        commentary.push({ text: play, owner: "boss", points: 0 });
        fullCommentary.push({ text: play, owner: "boss", points: 0 });
      }
    }

    if (userScore >= 14 || bossScore >= 14) break;
  }

  if (userScore === bossScore && possessionCount >= MAX_POSSESSIONS) {
    if (Math.random() < 0.58) {
      userScore += 2;
    } else {
      bossScore += 2;
    }
  }

  return {
    userScore,
    bossScore,
    commentary: fullCommentary,
  };
}

function normalizePackId(id) {
  if (!id || typeof id !== "string") return id;
  let s = id.replace(/[\s_\-]/g, "");
  s = s.replace(/pack$/i, "");
  if (s.toLowerCase() === "vaultunlimited") return "vaultUnlimited";
  if (s.toLowerCase() === "100ovr") return "100ovr";
  return s;
}

function prettyPackName(p) {
  if (!p || typeof p !== "string") return p;
  if (p === "vaultUnlimited") return "Vault Unlimited";
  if (p === "100ovr") return "100 OVR";
  const spaced = p
    .replace(/([A-Z])/g, " $1")
    .replace(/([a-z])([0-9])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function sanitizeText(s) {
  if (s == null) return s;
  try {
    return String(s).replace(/\+/g, "");
  } catch (e) {
    return s;
  }
}

function awardSingleReward(selectedBoss, user, options = {}) {
  let rewardText = "";
  const rewards = Array.isArray(selectedBoss.rewards)
    ? selectedBoss.rewards
    : [];

  const passesPack = (chance) =>
    Math.random() < Math.min(1, Number(chance) || 0);
  const passesCard = (chance) => {
    const num = Number(chance) || 0;
    const prob = num > 1 ? Math.min(1, num / 100) : Math.min(1, num);
    return Math.random() < prob;
  };

  for (const r of rewards.filter((x) => x.type === "card")) {
    if (!r) continue;
    const chance = r.chance || 0;
    if (passesCard(chance)) {
      let chosen = Array.isArray(r.id)
        ? r.id[Math.floor(Math.random() * r.id.length)]
        : r.id;
      if (!chosen) continue;

      let chosenId = chosen;
      try {
        if (typeof chosen === "string" && chosen.includes("<:")) {
          const tiers = [
            "bossBattles",
            "throwbacks",
            "goats",
            "100ovr",
            "invincible",
            "galaxyOpal",
            "pinkDiamond",
            "diamond",
            "amethys",
            "ruby",
            "sapphire",
            "emerald",
            "darkMatter",
          ];
          for (const t of tiers) {
            try {
              const cfg = require(`../../configs/cards/${t}.json`);
              const prop = getTierPropertyName(t);
              const list = Array.isArray(cfg[prop])
                ? cfg[prop]
                : Object.values(cfg[prop] || {}).flat();
              const found = list?.find(
                (c) =>
                  c &&
                  (c.cardEmoji === chosen ||
                    (c.cardEmoji && chosen.includes(c.cardEmoji)) ||
                    String(c.id) === chosen)
              );
              if (found) {
                chosenId = found.id;
                break;
              }
            } catch (e) {
              continue;
            }
          }

          if (chosenId === chosen) {
            try {
              const bossCfg =
                require("../../configs/cards/bossBattles.json").bossBattles ||
                [];
              const bossFound = bossCfg.find(
                (b) =>
                  Array.isArray(b.rewards) &&
                  b.rewards.some((rr) => rr.type === "card" && rr.id === chosen)
              );
              if (bossFound) chosenId = bossFound.id;
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {}

      if (typeof chosenId !== "string") chosenId = String(chosenId);

      user.cards = user.cards || [];
      if (!user.cards.includes(chosenId)) user.cards.push(chosenId);

      const info = getCardInfo(chosenId) || getCardInfo(chosen);
      const emoji =
        info && info.cardEmoji
          ? info.cardEmoji
          : typeof chosen === "string" && chosen.includes(":")
          ? chosen
          : "🎴";
      let displayName =
        info && info.name
          ? info.name
          : typeof chosen === "string"
          ? chosen
          : "Boss Card";
      try {
        displayName = displayName.replace(emoji, "").trim();
      } catch (e) {}

      rewardText = `\n${emoji} **${displayName}**`;
      return rewardText;
    }
  }

  for (const r of rewards.filter((x) => x.type === "pack")) {
    if (!r) continue;
    const chance = r.chance || 0;
    if (passesPack(chance)) {
      const raw = r.id;
      const pid = normalizePackId(raw);
      user.packs = user.packs || [];
      user.packs.push(pid);
      let packEmoji = "📦";
      try {
        if (packs) {
          if (packs[`${pid}Pack`]) packEmoji = packs[`${pid}Pack`];
          else if (packs[pid]) packEmoji = packs[pid];
        }
      } catch (e) {
        // ignore
      }
      rewardText = `\n${packEmoji} **${prettyPackName(pid)}**`;
      return rewardText;
    }
  }

  const cur = rewards.find((x) => x.type === "currency");
  if (cur) {
    const min = cur.amount?.[0] || 0;
    const max = cur.amount?.[1] || min;
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;
    const multiplier = options.vip ? 2 : 1;
    const baseAmount = Math.floor(amount);
    if (Math.random() < 0.5) {
      const given = baseAmount * multiplier;
      user.mt = (user.mt || 0) + given;
      rewardText = `\n${general.MTP || "💎"} **${given.toLocaleString()}** MT${
        options.vip ? " (2x VIP Bonus)" : ""
      }`;
    } else {
      const given = baseAmount * multiplier;
      user.vc = (user.vc || 0) + given;
      rewardText = `\n${general.VC || "💰"} **${given.toLocaleString()}** VC${
        options.vip ? " (2x VIP Bonus)" : ""
      }`;
    }
    return rewardText;
  }
  const xp = rewards.find((x) => x.type === "xp");
  if (xp) {
    const min = xp.amount?.[0] || 0;
    const max = xp.amount?.[1] || min;
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;
    rewardText = `\n✨ **${amount.toLocaleString()} XP**`;
    return rewardText;
  }

  return rewardText;
}

module.exports = {
  name: "battle",
  aliases: ["b", "bb"],
  cooldown: (message) =>
    message.member?.roles?.cache?.has(process.env.VIP_ROLE_ID) ? 45 : 65,
  description: "Defeat bosses for rewards",
  usage: "!battle <difficulty> (easy, medium, hard, impossible, insane)",
  async execute(message, args, client) {
    const discordId = message.author.id;

    try {
      if (cooldowns.has(discordId)) {
        const timeLeft = cooldowns.get(discordId) - Date.now();
        if (timeLeft > 0) {
          return message.reply(
            `❌ Please wait ${(timeLeft / 1000).toFixed(
              1
            )} more seconds before starting another battle.`
          );
        }
        cooldowns.delete(discordId);
      }

      if (activeBattles.has(discordId)) {
        return message.reply(
          "❌ You already have an active battle! Please wait for it to complete."
        );
      }

      const team = await Team.findOne({ discordId });
      if (!team || !team.cards.length) {
        return message.reply(
          "❌ You need to have a team first! Use !team to check your team."
        );
      }

      const now = Date.now();
      if (cooldowns.has(discordId)) {
        const expirationTime = cooldowns.get(discordId);
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(
            `⏱️ Please wait ${timeLeft.toFixed(
              1
            )} more second(s) before battling again!`
          );
        }
        cooldowns.delete(discordId);
      }

      const cooldownTime = message.member?.roles?.cache?.has(
        process.env.VIP_ROLE_ID
      )
        ? 45000
        : 65000;
      cooldowns.set(discordId, now + cooldownTime);
      setTimeout(() => cooldowns.delete(discordId), cooldownTime);

      if (pvpCooldowns.has(discordId)) {
        const pvpExpiration = pvpCooldowns.get(discordId);
        if (now < pvpExpiration) {
          const timeLeft = (pvpExpiration - now) / 1000;
          return message.reply(
            `⏱️ Please wait ${timeLeft.toFixed(
              1
            )} more second(s) before starting another PvP battle!`
          );
        }
        pvpCooldowns.delete(discordId);
      }

      if (message.mentions.users.size > 0) {
        const opponent = message.mentions.users.first();
        if (opponent.id === discordId) {
          return message.reply("❌ You cannot challenge yourself!");
        }

        const pvpCooldownTime = message.member?.roles?.cache?.has(
          process.env.VIP_ROLE_ID
        )
          ? 45000
          : 65000;
        pvpCooldowns.set(discordId, now + pvpCooldownTime);
        setTimeout(() => pvpCooldowns.delete(discordId), pvpCooldownTime);

        const opponentTeam = await Team.findOne({ discordId: opponent.id });
        if (!opponentTeam || !opponentTeam.cards.length) {
          return message.reply("❌ Your opponent needs to have a team first!");
        }

        const pendingBattle = new PendingBattle({
          challengerId: discordId,
          challengerTeam: team.cards,
          defenderId: opponent.id,
        });

        await pendingBattle.save();

        const challengeEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("⚔️ PvP Battle Challenge")
          .setDescription(
            `${message.author} has challenged ${opponent} to a battle!\n\nPossible Rewards:\n- 25,000-200,000 VC ${general.VC}\n- 5,000-150,000 MT ${general.MTP}\n- Super Deluxe And Upwards\n\nClick the buttons below to accept or decline.`
          )
          .addFields(
            {
              name: "Challenger's Team",
              value: team.cards
                .map(
                  (cardId) =>
                    `> ${getCardInfo(cardId)?.cardEmoji || "🏀"} ${
                      getCardInfo(cardId)?.name || cardId
                    }`
                )
                .join("\n"),
            },
            {
              name: "Opponent's Team",
              value: opponentTeam.cards
                .map(
                  (cardId) =>
                    `> ${getCardInfo(cardId)?.cardEmoji || "🏀"} ${
                      getCardInfo(cardId)?.name || cardId
                    }`
                )
                .join("\n"),
            }
          )
          .setFooter({ text: "Challenge expires in 5 minutes" });

        const acceptButton = new ButtonBuilder()
          .setCustomId(`accept_pvp_${pendingBattle._id}`)
          .setLabel("Accept Challenge")
          .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
          .setCustomId(`decline_pvp_${pendingBattle._id}`)
          .setLabel("Decline Challenge")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(
          acceptButton,
          declineButton
        );

        return message.reply({ embeds: [challengeEmbed], components: [row] });
      }

      const difficulty = args[0]?.toLowerCase() || "easy";
      if (!DIFFICULTY_MAP[difficulty]) {
        activeBattles.delete(discordId);
        return message.reply(
          "❌ Invalid difficulty! Choose: easy, medium, hard, impossible, or insane"
        );
      }

      const bossBattles =
        require("../../configs/cards/bossBattles.json").bossBattles;
      const availableBosses = bossBattles.filter(
        (boss) =>
          boss.difficulty &&
          boss.difficulty.toLowerCase() === difficulty.toLowerCase()
      );

      if (!availableBosses.length) {
        activeBattles.delete(discordId);
        return message.reply(
          "❌ No boss battles available for this difficulty!"
        );
      }

      const selectedBoss =
        availableBosses[Math.floor(Math.random() * availableBosses.length)];

      const isVip = message.member?.roles?.cache?.has(process.env.VIP_ROLE_ID);
      cooldowns.set(discordId, Date.now() + (isVip ? 45000 : 65000));

      const bossInfo = getCardInfo(selectedBoss.team[0]);
      const bossEmoji = bossInfo?.cardEmoji || general.Battle || "⚔️";

      const startEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`${bossEmoji} Boss Battle Starts!`)
        .setDescription(
          `
‎
**⚔️ The game begins!**
> 🎮 **${message.author.username}** vs **${selectedBoss.name}**
> 🎯 **First to 14 Points**
> ⚔️ **Difficulty:** ${difficulty} (${
            DIFFICULTY_MULTIPLIERS[DIFFICULTY_MAP[difficulty]]
          }x)
‎
**Your Team:**
${team.cards
  .map((cardId, i) => {
    const card = getCardInfo(cardId);
    return `> ${card?.cardEmoji || "🏀"} **${card?.name || cardId}**`;
  })
  .join("\n")}
‎
**Boss Team:**
${selectedBoss.team
  .map((cardId) => {
    const card = getCardInfo(cardId);
    return `> ${card?.cardEmoji || "🏀"} **${card?.name || cardId}**`;
  })
  .join("\n")}`
        )
        .setThumbnail(
          selectedBoss.thumbnail || message.author.displayAvatarURL()
        )
        .setFooter({
          text: "NBA Vault • Boss Battle",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      let gameMessage;
      try {
        gameMessage = await sendWithTimeout(
          message.reply({ embeds: [startEmbed] }),
          10000
        );
      } catch (err) {
        console.error("❌ Failed to send start embed:", err.message);
        activeBattles.delete(discordId);
        throw new Error("Could not send the start embed - please try again");
      }

      const result = await simulateGame(
        team,
        selectedBoss.team,
        DIFFICULTY_MAP[difficulty]
      );

      let currentUserScore = 0;
      let currentBossScore = 0;

      for (let i = 0; i < result.commentary.length; i++) {
        const playObj = result.commentary[i];
        const playText = sanitizeText(playObj?.text || String(playObj));
        const pts = Number(playObj?.points) || 0;

        if (pts > 0) {
          if (playObj.owner === "user") currentUserScore += pts;
          else currentBossScore += pts;
        }

        const playEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${bossEmoji} Boss Battle - Live Play`)
          .setDescription(
            `‎
**📊 Current Score**
> Your Team: **${currentUserScore}** Points
> Boss Team: **${currentBossScore}** Points

**🎯 Latest Play**
> ${playText}`
          )
          .setThumbnail(
            selectedBoss.thumbnail || message.author.displayAvatarURL()
          )
          .setFooter({
            text: "NBA Vault • Boss Battle",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        try {
          await sendWithTimeout(
            gameMessage.edit({ embeds: [playEmbed] }),
            5000
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (editError) {
          console.log(
            "⚠️ Failed to edit message for play",
            i,
            "- continuing..."
          );
          break;
        }

        if (currentUserScore >= 14 || currentBossScore >= 14) break;
      }

      let rewardText = "";
      if (result.userScore > result.bossScore) {
        const user = await User.findOne({ discordId });
        const isVip = !!message.member?.roles?.cache?.has(
          process.env.VIP_ROLE_ID
        );

        rewardText = awardSingleReward(selectedBoss, user, { vip: isVip });

        rewardText = sanitizeText(rewardText);

        await user.save();
      }

      const userTeamStats = sanitizeText(
        await getTeamStats(team.cards, result.commentary)
      );
      const bossTeamStats = sanitizeText(
        await getBossTeamStats(selectedBoss.team, result.commentary)
      );

      const outcomeEmoji = result.userScore > result.bossScore ? "🏆" : "💀";
      const outcomeMessage =
        result.userScore > result.bossScore ? "VICTORY!" : "DEFEAT!";

      const finalEmbed = new EmbedBuilder()
        .setColor(result.userScore > result.bossScore ? "#00FF00" : "#FF0000")
        .setTitle(`${bossEmoji} Boss Battle - Final Results`)
        .setDescription(
          `
‎
**${outcomeEmoji} ${outcomeMessage}**
> 🎮 **${message.author.username}** vs **${selectedBoss.name}**
> 🎯 First to 14 Points
> ⚔️ Difficulty: ${difficulty} (${
            DIFFICULTY_MULTIPLIERS[DIFFICULTY_MAP[difficulty]]
          }x)
‎
**📊 Final Score**
> Your Team: **${result.userScore}** Points
> Boss Team: **${result.bossScore}** Points
‎
**🏀 Your Team Stats**
${userTeamStats || "> No stats available"}
‎
**👿 Boss Team Stats**
${bossTeamStats || "> No stats available"}`
        )
        .setThumbnail(
          selectedBoss.thumbnail || message.author.displayAvatarURL()
        )
        .setFooter({
          text: "NBA Vault • Boss Battle",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      if (result.userScore > result.bossScore && rewardText) {
        finalEmbed.addFields({ name: "🎁 Rewards Earned", value: rewardText });
      }

      await sendWithTimeout(gameMessage.edit({ embeds: [finalEmbed] }), 10000);
    } catch (error) {
      console.error("❌ Battle execution error:", error);

      activeBattles.delete(discordId);

      try {
        await message.reply(`❌ Battle failed: ${error.message}`);
      } catch (replyError) {
        console.error("❌ Failed to send error message:", replyError);
      }
    } finally {
      activeBattles.delete(discordId);
    }
  },
};
