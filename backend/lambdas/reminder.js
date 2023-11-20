'use strict';
const telegramUtils = require('../utils/telegramUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require("../utils/googleSheetsUtils");

module.exports.handler = async (event) => {
  console.log(messages.BOT_HANDLER_TRIGGER);

  const deadlineColumn = config.DEADLINE_COLUMN;
  const usernameColumn = config.USERNAME_COLUMN;
  const chatIDColumn = config.CHATID_COLUMN;

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let chatIDs = [];
    if (rows && rows.length > 0) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const deadline = row[deadlineColumn];
        //if current date > deadline on %days%
        //add row[chatIDColumn] to chatIDs array
      }
    }


  } catch (error) {
    console.error(error);
  }


  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
