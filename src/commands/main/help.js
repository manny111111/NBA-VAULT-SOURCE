/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const teamexport = require("./teamexport");
const teamimport = require("./teamimport");

module.exports = {
  name: "help",
  description: "List all commands",
  cooldown: 3,
  async execute(message, args) {
    try {
      const hidden = new Set([
        "addvc",
        "addmt",
        "codeadd",
        "givecard",
        "givepacks",
        "resetdaily",
        "test",
        "testpack",
        "vipcodeadd",
      ]);

      const usageOverrides = {
        battle: "!battle <difficulty | @user> [aliases: b, bb]",
        teamadd: "!teamadd <cardId> [aliases: ta]",
        teamremove: "!teamremove <index> [aliases: tr]",
        buypack: "!buypack <pack>",
        openpack: "!openpack <pack> | <amount>",
        givecard: "!givecard <user> <cardId>",
        givepacks: "!givepacks <user> <pack> <amount>",
        addvc: "!addvc <user> <amount>",
        addmt: "!addmt <user> <amount>",
        collection: "!collection [tier]",
        inventory: "!inventory [filter]",
        shop: "!shop [cards|packs]",
        buycard: "!buycard <cardId>",
        coderedeem: "!coderedeem <code>",
        cardpreview: "!cardpreview <cardId>",
        teamexport: "!teamexport <json/csv>",
        teamimport: "!teamimport <base64code>",
      };

      const mainDir = path.join(__dirname);
      const slashDir = path.join(__dirname, "..", "slash");

      const readCommands = (dir, isSlash = false) => {
        if (!fs.existsSync(dir)) return [];
        return fs
          .readdirSync(dir)
          .filter((f) => f.endsWith(".js"))
          .map((file) => {
            try {
              const cmd = require(path.join(dir, file));
              const name = isSlash
                ? cmd.data?.name || cmd.name || file.replace(".js", "")
                : cmd.name || file.replace(".js", "");
              const usage = !isSlash
                ? cmd.usage || usageOverrides[name] || `!${name}`
                : `/${name}`;
              const desc =
                cmd.description || cmd.data?.description || "No description";
              const aliases = Array.isArray(cmd.aliases) ? cmd.aliases : [];
              const cooldown = cmd.cooldown || 0;
              if (hidden.has(name)) return null;
              return { name, usage, desc, aliases, cooldown };
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));
      };

      const mainCommands = readCommands(mainDir, false).filter(
        (c) => c.name !== "help"
      );
      const slashCommands = readCommands(slashDir, true);
      const query = args && args[0] ? String(args[0]).toLowerCase() : null;
      if (query) {
        const mainCmd = mainCommands.find(
          (c) =>
            c.name.toLowerCase() === query ||
            (c.aliases || []).map((a) => a.toLowerCase()).includes(query)
        );
        const slashCmd = slashCommands.find(
          (c) => c.name.toLowerCase() === query
        );
        if (!mainCmd && !slashCmd)
          return message.reply(`❌ Command \`${query}\` not found.`);

        const name = mainCmd?.name || slashCmd?.name || query;
        const description = mainCmd?.desc || slashCmd?.desc || "No description";
        const aliases = mainCmd?.aliases || [];
        const cooldown = mainCmd?.cooldown || slashCmd?.cooldown || 0;
        const msgUsage = mainCmd ? mainCmd.usage : null;
        const slashUsage = slashCmd ? slashCmd.usage : null;
        const type =
          mainCmd && slashCmd
            ? "Message & Slash"
            : mainCmd
            ? "Message"
            : "Slash";
        let detailDescription = `# 🏀 ${name.toUpperCase()}\n`;
        detailDescription += `> ${description}\n\n`;
        detailDescription += `### 📋 Command Information\n`;
        detailDescription += `🔹 **Type:** ${type}\n`;
        detailDescription += `⏱️ **Cooldown:** ${
          cooldown ? `${cooldown} seconds` : "No cooldown"
        }\n\n`;
        if (msgUsage || slashUsage) {
          detailDescription += `### 💻 Usage Examples\n`;
          if (msgUsage)
            detailDescription += `📝 **Message Command**\n\`\`\`\n${msgUsage}\`\`\`\n`;
          if (slashUsage)
            detailDescription += `⚡ **Slash Command**\n\`\`\`\n${slashUsage}\`\`\`\n`;
        }
        if (aliases && aliases.length > 0) {
          detailDescription += `### 🎯 Quick Shortcuts\n`;
          detailDescription += `${aliases
            .map((alias) => `\`!${alias}\``)
            .join("  •  ")}\n`;
          detailDescription += `*Use any of these instead of the full command name*\n\n`;
        }
        detailDescription += `### 🌟 Availability\n`;
        if (mainCmd && slashCmd) {
          detailDescription += `✅ **Message Command:** \`!${name}\`\n`;
          detailDescription += `✅ **Slash Command:** \`/${name}\`\n`;
        } else if (mainCmd) {
          detailDescription += `✅ **Message Command:** \`!${name}\`\n`;
          detailDescription += `❌ **Slash Command:** Not available\n`;
        } else if (slashCmd) {
          detailDescription += `❌ **Message Command:** Not available\n`;
          detailDescription += `✅ **Slash Command:** \`/${name}\`\n`;
        }

        detailDescription += `\n───────────────────\n`;
        detailDescription += `💡 **Tip:** Use \`!help\` to explore all ${
          mainCommands.length + slashCommands.length
        } commands!`;

        const embed = new EmbedBuilder()
          .setColor("#ff6b35")
          .setDescription(detailDescription)
          .setThumbnail(message.client.user?.displayAvatarURL?.())
          .setFooter({
            text: "🏀 NBA Vault • Command Details",
            iconURL: message.client.user?.displayAvatarURL?.(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
      function buildCommandGrid(commands, emoji, title) {
        if (!commands.length) return `### ${emoji} ${title}\n*None*\n\n`;

        let section = `### ${emoji} ${title}\n`;
        const commandsPerRow = 5;
        const rows = [];

        for (let i = 0; i < commands.length; i += commandsPerRow) {
          const row = commands.slice(i, i + commandsPerRow);
          const formattedRow = row
            .map((cmd) => {
              const baseCmd = cmd.usage
                .split(" ")[0]
                .replace("!", "")
                .replace("/", "");
              return `\`${baseCmd}\``;
            })
            .join(" • ");
          rows.push(formattedRow);
        }

        section += rows.join("\n") + "\n\n";
        return section;
      }
      let mainDescription = `## 🏀 NBA VAULT\n`;
      mainDescription += `Use \`!help <command>\` for details\n\n`;

      mainDescription += buildCommandGrid(
        mainCommands,
        "💬",
        "Message Commands"
      );
      mainDescription += buildCommandGrid(
        slashCommands,
        "⚡",
        "Slash Commands"
      );

      const embed = new EmbedBuilder()
        .setColor("#1e90ff")
        .setDescription(mainDescription)
        .setFooter({
          text: `🏀 NBA Vault • ${
            mainCommands.length + slashCommands.length
          } commands`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error("Failed to build help embed:", err);
      try {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff4757")
          .setDescription("❌ **Error loading help**\nTry again later.")
          .setFooter({ text: "🏀 NBA Vault" })
          .setTimestamp();
        await message.reply({ embeds: [errorEmbed] });
      } catch (e) {}
    }
  },
};
