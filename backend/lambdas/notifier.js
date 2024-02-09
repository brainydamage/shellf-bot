'use strict';
const telegramUtils = require('../utils/telegramUtils');
const dateTimeUtils = require('../utils/dateTimeUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const userMessages = require('../constants/userMessages');
const googleSheetsUtils = require("../utils/googleSheetsUtils");
const log = require('../utils/customLogger');

function sendMessage(chatId, message) {
  log.info('notifier', 'Status: "%s", ChatID: %s',
    messages.SENDING_NOTIFICATION, chatId);

  return telegramUtils.sendFormattedMessage(chatId, message);
}

module.exports.handler = async (event) => {
  const currentDate = dateTimeUtils.addNDaysAndFormat(
    Math.floor(Date.now() / 1000), 0);
  log.info('notifier', 'Mass notification date: %s', currentDate);

  try {
    const rowsLog = await googleSheetsUtils.getRows(config.BOOKS_LOG);
    const rowsReturned = await googleSheetsUtils.getRows(config.BOOKS_RETURNED);
    const allRows = rowsLog.concat(rowsReturned);

    const chatIDs = allRows.map(array => array[config.CHATID_COLUMN_LOG])
      .filter(chatID => chatID !== 'chatID');
    const uniqueChatIDs = [...new Set(chatIDs)];

    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < uniqueChatIDs.length; i += 20) {
      const batch = uniqueChatIDs.slice(i, i + 20); //take 20 messages
      await Promise.all(batch.map(
        chatId => sendMessage(chatId, `${userMessages.NOTIFICATION}`))); //send
                                                                         // them
      await delay(2000); // Wait for 2 second
    }

  } catch (error) {
    log.error('notifier', `Reason: "%s", ErrorMessage: %s`,
      messages.FAILED_NOTIFIER, error.message);

    console.error(error);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};