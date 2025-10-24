/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { createEvent, EVENT_TYPES } = require("../utils/eventUtils");
const { Client } = require("discord.js");

function scheduleRandomEvents(client) {
  setInterval(async () => {
    try {
      const eventTypes = Object.keys(EVENT_TYPES);
      const randomEvent =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];

      const event = await createEvent(randomEvent);
      if (event) {
        const channel = await client.channels.fetch(
          process.env.WEEKLY_EVENTS_CHANNEL
        );
        if (channel) {
          await channel.send({
            content: `<@&1414606172471951421> New Event Started: **${event.eventName}**!\n${event.description}\nDuration: ${EVENT_TYPES[randomEvent].duration}`,
          });
        }
      }
    } catch (error) {
      console.error("Error scheduling event:", error);
    }
  }, Math.random() * (3 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000) + 24 * 60 * 60 * 1000);
}

module.exports = { scheduleRandomEvents };
