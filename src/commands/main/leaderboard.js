/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const User = require("../../database/UserSchema");
const { general } = require("../../configs/emojis/main.json");

const EXCLUDE_IDS = [""];

module.exports = {
  name: "leaderboard",
  description: "Show top players by MT or VC (paginated)",
  cooldown: 5,
  async execute(message, args) {
    try {
      const limit = 50;
      const perPage = 10;

      let currentMetric =
        (args[0] || "mt").toLowerCase() === "vc" ? "vc" : "mt";
      let page = 1;

      const fetchEntries = async (metric) => {
        const top = await User.find({ discordId: { $nin: EXCLUDE_IDS } })
          .sort({ [metric]: -1 })
          .limit(limit)
          .lean();
        return top.map((u, i) => {
          const rank = i + 1;
          const name = u.username || `<@${u.discordId}>`;
          const value = Number(u[metric] || 0).toLocaleString();

          let rankDisplay = "";
          if (rank === 1) rankDisplay = "<:1st:1421667668502515722>";
          else if (rank === 2) rankDisplay = "<:2nd:1421667672407412867>";
          else if (rank === 3) rankDisplay = "<:3rd:1421667674131402772>";
          else rankDisplay = `\`${rank.toString().padStart(2, "0")}\``;

          const metricEmoji = metric === "vc" ? general.VC : general.MTP;
          return `${rankDisplay} **${name}** ─ ${metricEmoji} \`${value}\``;
        });
      };

      let entries = await fetchEntries(currentMetric);
      let totalPages = Math.max(1, Math.ceil(entries.length / perPage));

      const buildEmbed = (p, metric) => {
        const start = (p - 1) * perPage;
        const pageEntries = entries.slice(start, start + perPage);

        const metricName = metric.toUpperCase();
        const metricEmoji = metric === "vc" ? general.VC : general.MTP;

        return new EmbedBuilder()
          .setTitle(`🏆 ${metricName} Leaderboard`)
          .setColor(metric === "vc" ? "#9b59b6" : "#f39c12")
          .setDescription(
            `### Top Players by ${metricName}\n` +
              `${pageEntries.join("\n") || "> No entries found"}\n\u200b`
          )
          .setFooter({
            text: `Page ${p} of ${totalPages} • Showing top ${entries.length} players`,
            iconURL: message.guild?.iconURL() || undefined,
          })
          .setTimestamp();
      };

      const prevButton = new ButtonBuilder()
        .setCustomId("lb_prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
        .setDisabled(true);

      const nextButton = new ButtonBuilder()
        .setCustomId("lb_next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️")
        .setDisabled(totalPages <= 1);

      const metricSelect = new StringSelectMenuBuilder()
        .setCustomId("lb_metric")
        .setPlaceholder("📊 Select Metric")
        .addOptions([
          {
            label: "MT Leaderboard",
            value: "mt",
            description: "View rankings by MyTeam Points",
            default: currentMetric === "mt",
            emoji: general.MTP,
          },
          {
            label: "VC Leaderboard",
            value: "vc",
            description: "View rankings by Virtual Currency",
            default: currentMetric === "vc",
            emoji: general.VC,
          },
        ]);

      const buttonRow = new ActionRowBuilder().addComponents(
        prevButton,
        nextButton
      );
      const selectRow = new ActionRowBuilder().addComponents(metricSelect);

      const sent = await message.reply({
        embeds: [buildEmbed(page, currentMetric)],
        components: [buttonRow, selectRow],
      });

      const collector = sent.createMessageComponentCollector({ time: 120000 });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "⚠️ This leaderboard is for the command user only.",
            ephemeral: true,
          });
        }

        if (
          interaction.isStringSelectMenu() &&
          interaction.customId === "lb_metric"
        ) {
          currentMetric = interaction.values[0] === "vc" ? "vc" : "mt";
          page = 1;
          entries = await fetchEntries(currentMetric);
          totalPages = Math.max(1, Math.ceil(entries.length / perPage));
          prevButton.setDisabled(true);
          nextButton.setDisabled(totalPages <= 1);

          const newSelect = new StringSelectMenuBuilder()
            .setCustomId("lb_metric")
            .setPlaceholder("📊 Select Metric")
            .addOptions([
              {
                label: "MT Leaderboard",
                value: "mt",
                description: "View rankings by MyTeam Points",
                default: currentMetric === "mt",
                emoji: general.MTP,
              },
              {
                label: "VC Leaderboard",
                value: "vc",
                description: "View rankings by Virtual Currency",
                default: currentMetric === "vc",
                emoji: general.VC,
              },
            ]);

          const newSelectRow = new ActionRowBuilder().addComponents(newSelect);
          try {
            await interaction.update({
              embeds: [buildEmbed(page, currentMetric)],
              components: [buttonRow, newSelectRow],
            });
          } catch (e) {
            console.error("Leaderboard select update failed", e);
          }
          return;
        }

        if (interaction.isButton()) {
          if (interaction.customId === "lb_prev") page = Math.max(1, page - 1);
          else if (interaction.customId === "lb_next")
            page = Math.min(totalPages, page + 1);

          prevButton.setDisabled(page === 1);
          nextButton.setDisabled(page === totalPages);

          try {
            await interaction.update({
              embeds: [buildEmbed(page, currentMetric)],
              components: [buttonRow, selectRow],
            });
          } catch (e) {
            console.error("Leaderboard button update failed", e);
          }
          return;
        }
      });

      collector.on("end", async () => {
        try {
          prevButton.setDisabled(true);
          nextButton.setDisabled(true);
          await sent.edit({ components: [buttonRow, selectRow] });
        } catch (e) {}
      });
    } catch (err) {
      console.error("leaderboard error", err);
      return message.reply(
        "❌ Error fetching leaderboard. Please try again later."
      );
    }
  },
};
