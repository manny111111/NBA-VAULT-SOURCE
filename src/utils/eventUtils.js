/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const Event = require("../database/EventsSchema");
const { EmbedBuilder } = require("discord.js");

const EVENT_TYPES = {
  LEBRON: {
    name: "LeBron Event",
    description: "3x chance to pack LeBron cards!",
    duration: "24h",
    multipliers: { lebron: 3 },
  },
  CURRY: {
    name: "Curry Event",
    description: "3x chance to pack Stephen Curry cards!",
    duration: "24h",
    multipliers: { curry: 3 },
  },
  DURANT: {
    name: "Durant Event",
    description: "3x chance to pack Kevin Durant cards!",
    duration: "24h",
    multipliers: { durant: 3 },
  },
};

async function createEvent(eventType) {
  const event = EVENT_TYPES[eventType];
  if (!event) return null;

  const duration = parseDuration(event.duration);
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + duration);

  const newEvent = new Event({
    eventName: event.name,
    startDate,
    endDate,
    description: event.description,
    cardMultipliers: event.multipliers,
  });

  await newEvent.save();
  return newEvent;
}

function parseDuration(duration) {
  if (!duration) return 0;

  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

async function getActiveEvent() {
  return await Event.findOne({
    active: true,
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() },
  });
}

module.exports = {
  EVENT_TYPES,
  createEvent,
  getActiveEvent,
  parseDuration,
};
