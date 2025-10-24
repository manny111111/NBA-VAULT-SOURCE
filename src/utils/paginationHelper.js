/**
 * 2XM NBA Vault Discord Bot
 * @version 2.0.0
 * @author manny11111111
 * @copyright 2024
 * @license GNU General Public License v3.0
 */



const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function createPaginationRow(currentPage, totalPages) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("prev_page")
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0)
  );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("page_indicator")
      .setLabel(`Page ${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("next_page")
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1)
  );

  return row;
}

module.exports = {
  chunkArray,
  createPaginationRow,
};
