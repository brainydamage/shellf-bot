'use strict';
const telegramUtils = require('../utils/telegramUtils');
const dateTimeUtils = require('../utils/dateTimeUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const userMessages = require('../constants/userMessages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');
const log = require('../utils/customLogger');
const commands = require('../constants/commands');

function sendMessage(chatId, message) {
  log.info('notifier', 'Status: "%s", ChatID: %s',
    messages.SENDING_NOTIFICATION, chatId);

  return telegramUtils.sendFormattedMessage(chatId, message);
}

module.exports.handler = async (parsedBody) => {
  if (parsedBody.command === commands.START) {
    //when someone borrows the book
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    const otherBorrowersOfThisBook = rows
      .filter(row => parseInt(row[config.BOOKID_COLUMN_LOG], 10) ===
        parsedBody.bookID)
      .filter(row => parseInt(row[config.CHATID_COLUMN_LOG], 10) !==
        parsedBody.chatID)
      .filter(row => row[config.RETURN_COLUMN_LOG] === '');

    if (otherBorrowersOfThisBook.length > 0) {
      const bookTitle = otherBorrowersOfThisBook[0][config.TITLE_COLUMN_LOG];
      const bookAuthor = otherBorrowersOfThisBook[0][config.AUTHOR_COLUMN_LOG];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
      const shelf = otherBorrowersOfThisBook[0][config.SHELF_COLUMN_LOG];

      const message = `${userMessages.BOOK_NOT_MARKED_AS_RETURNED_1}*${bookInfo}*\n\n${userMessages.BOOK_NOT_MARKED_AS_RETURNED_2}*${shelf}*${userMessages.BOOK_NOT_MARKED_AS_RETURNED_3}\n\n${userMessages.BOOK_NOT_MARKED_AS_RETURNED_4}`;

      //notify all that they probably forgot to return the book
      for (const otherBorrower of otherBorrowersOfThisBook) {
        log.warn('notifier',
          'Warning: "%s", BookID: %s, BookInfo: %s, Username: %s, ChatID: %s, Shelf: %s',
          messages.BOOK_NOT_MARKED_AS_RETURNED, parsedBody.bookID, bookInfo,
          otherBorrower[config.USERNAME_COLUMN_LOG],
          otherBorrower[config.CHATID_COLUMN_LOG], shelf);

        await telegramUtils.sendFormattedMessage(
          parseInt(otherBorrower[config.CHATID_COLUMN_LOG], 10), message);
      }
    }
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: parsedBody,
    }, null, 2),
  };
};


//FIX IN CASE OF MASS NOTIFICATIONS
module.exports.massNotify = async (event) => {
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