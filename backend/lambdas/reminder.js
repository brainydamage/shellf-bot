'use strict';
const telegramUtils = require('../utils/telegramUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require("../utils/googleSheetsUtils");
const log = require('npmlog');

function isDeadlineIn3Days(deadline) {
  const deadlineDate = parseDate(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;
  const timeDiff = deadlineDate.getTime() - today.getTime();

  return timeDiff === threeDaysInMilliseconds;
}

function parseDate(dateString) {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
}

module.exports.handler = async (event) => {
  const deadlineColumn = config.DEADLINE_COLUMN;
  const returnedColumn = config.RETURN_COLUMN;
  const prolongedColumn = config.PROLONG_COLUMN;
  const bookIDColumn = config.BOOKID_COLUMN;
  const titleColumn = config.TITLE_COLUMN_LOG;
  const authorColumn = config.AUTHOR_COLUMN_LOG;
  const chatIDColumn = config.CHATID_COLUMN;

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let reminders = [];
    if (rows && rows.length > 0) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const deadline = row[deadlineColumn];
        const returned = row[returnedColumn];

        if (!returned && isDeadlineIn3Days(deadline)) {
          reminders.push({
            chatID: row[chatIDColumn],
            bookID: row[bookIDColumn],
            title: row[titleColumn],
            author: row[authorColumn],
            deadline: deadline,
            prolonged: row[prolongedColumn],
            rowNumber: i + 1,
          });
        }
      }
    }

    // Logic to send messages
    for (const reminder of reminders) {
      log.info('reminder',
        'Message: "%s", ChatID: %s, BookID: %s, Title: %s, Author: %s',
        messages.SENDING_REMINDER, reminder.chatID, reminder.bookID,
        reminder.title, reminder.author);

      await telegramUtils.remindToReturn(reminder.chatID, reminder);
    }

  } catch (error) {
    log.error('reminder', `Reason: "%s", ErrorMessage: %s`,
      messages.FAILED_REMINDER, error.message);

    console.error(error);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
