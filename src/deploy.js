/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { REST, Routes } = require("discord.js");
const { readdirSync, statSync, existsSync } = require("fs");
const { join } = require("path");
require("dotenv").config();

const commands = [];

const loadSlashCommandsRecursively = (dir) => {
  if (!existsSync(dir)) {
    console.log(`⚠️ Directory not found: ${dir}`);
    return;
  }

  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      loadSlashCommandsRecursively(filePath);
    } else if (file.endsWith(".js")) {
      try {
        const command = require(filePath);
        if (command.data) {
          commands.push(command.data.toJSON());
          console.log(`✅ Found slash command: ${command.data.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load command ${file}:`, error.message);
      }
    }
  }
};

const deploy = async () => {
  try {
    console.log("🔍 Loading slash commands...");
    loadSlashCommandsRecursively(join(__dirname, "commands"));

    console.log(`📊 Found ${commands.length} slash commands to deploy`);

    if (commands.length === 0) {
      console.log("❌ No slash commands found!");
      return;
    }

    const rest = new REST().setToken(process.env.TOKEN);

    console.log("🚀 Started refreshing application (/) commands...");

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(
      `✅ Successfully reloaded ${data.length} application (/) commands!`
    );

    data.forEach((cmd) => {
      console.log(`   - /${cmd.name}: ${cmd.description}`);
    });
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
};

deploy();
