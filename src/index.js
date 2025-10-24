/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");
const { readdirSync, statSync, existsSync } = require("fs");
const { join } = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
const commandFiles = readdirSync("./src/commands/main").filter((file) =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  const command = require(`./commands/main/${file}`);
  client.commands.set(command.name, command);
}

client.slashCommands = new Collection();
client.cooldowns = new Collection();

client.config = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  mongoUri: process.env.MONGO_URI,
  prefix: process.env.PREFIX || "!",
  ownerIds: JSON.parse(process.env.OWNER_IDS || "[]"),
  botLogs: process.env.BOT_LOGS,
  botLogsJoins: process.env.BOT_LOGS_JOINS,
  weeklyEventsChannel: process.env.WEEKLY_EVENTS_CHANNEL,
};

const loadCommandsRecursively = (dir, isSlash = false) => {
  if (!existsSync(dir)) {
    return;
  }

  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      loadCommandsRecursively(filePath, isSlash);
    } else if (file.endsWith(".js")) {
      try {
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (isSlash && command.data) {
          client.slashCommands.set(command.data.name, command);
        } else if (!isSlash && command.name) {
          client.commands.set(command.name, command);
        } else {
        }
      } catch (error) {
        console.error(`❌ Failed to load command ${file}:`, error.message);
        console.error(`   Full path: ${filePath}`);
      }
    }
  }
};

const loadCommands = () => {
  loadCommandsRecursively(join(__dirname, "commands", "main"), false);
  console.log(`📊 Total prefix commands loaded: ${client.commands.size}`);
};

const loadSlashCommands = () => {
  loadCommandsRecursively(join(__dirname, "commands", "slash"), true);
  console.log(`📊 Total slash commands loaded: ${client.slashCommands.size}`);
};

const deploySlashCommands = async () => {
  try {
    const commands = [];

    client.slashCommands.forEach((command) => {
      commands.push(command.data.toJSON());
    });

    if (commands.length === 0) {
      return;
    }

    const rest = new REST().setToken(client.config.token);

    const data = await rest.put(
      Routes.applicationCommands(client.config.clientId),
      { body: commands }
    );
  } catch (error) {
    console.error("❌ Error deploying slash commands:", error);
  }
};

const loadEvents = () => {
  const eventsPath = join(__dirname, "events");

  if (!existsSync(eventsPath)) {
    return;
  }

  const eventFiles = readdirSync(eventsPath).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of eventFiles) {
    try {
      const eventPath = join(eventsPath, file);
      delete require.cache[require.resolve(eventPath)];
      const event = require(eventPath);

      const eventName = event.name || file.split(".")[0];

      if (event.once) {
        client.once(eventName, (...args) => event.execute(...args, client));
      } else {
        client.on(eventName, (...args) => event.execute(...args, client));
      }
    } catch (error) {
      console.error(`❌ Failed to load event ${file}:`, error.message);
    }
  }
};

const connectDatabase = async () => {
  if (!client.config.mongoUri) {
    console.log("⚠️ No MongoDB URI provided, skipping database connection");
    return;
  }

  try {
    await mongoose.connect(client.config.mongoUri);
    console.log("✅ Connected to MongoDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const init = async () => {
  try {
    console.log("🚀 Starting Discord Bot...");

    loadCommands();
    loadSlashCommands();
    loadEvents();

    await connectDatabase();

    require("./schedulers/shopDaily");

    await client.login(process.env.TOKEN);

    function getClient() {
      return client;
    }

    module.exports = { getClient };

    await deploySlashCommands();
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) =>
  console.error("Unhandled promise rejection:", error)
);
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

init();

module.exports = client;
