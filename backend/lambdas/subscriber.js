'use strict';
const commands = require('../constants/commands');
const subscriberHandler = require('../handlers/subscriberHandler');
const telegramUtils = require("../utils/telegramUtils");
const log = require('../utils/customLogger');
const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const userMessages = require("../constants/userMessages");

module.exports.handler = async (parsedBody) => {
  if (parsedBody.subscribe) {
    await subscriberHandler.subscribeBook(parsedBody);
  } else if (parsedBody.command === commands.START) {
    //when someone borrows the book
    const rows = await googleSheetsUtils.getRows(config.BOOKS_SUBS);
    await subscriberHandler.unsubscribeUserFromBorrowedBook(rows, parsedBody);

    const subscriptionsForThisBook = rows
      .filter(row => parseInt(row[config.BOOKID_COLUMN_SUBS], 10) ===
        parsedBody.bookID)
      .filter(row => parseInt(row[config.CHATID_COLUMN_SUBS], 10) !==
        parsedBody.chatID)

    const bookTitle = subscriptionsForThisBook[0][config.TITLE_COLUMN_SUBS];
    const bookAuthor = subscriptionsForThisBook[0][config.AUTHOR_COLUMN_SUBS];
    const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
    const shelf = subscriptionsForThisBook[0][config.SHELF_COLUMN_SUBS];

    const message = `${userMessages.BOOK_BORROWED_NOTIFY_1}*${shelf}*:\n\n*${bookInfo}*\n\n${userMessages.BOOK_BORROWED_NOTIFY_2}`;

    //notify all that book is not available
    for (const subscription of subscriptionsForThisBook) {
      await telegramUtils.sendFormattedMessage(
        parseInt(subscription[config.CHATID_COLUMN_SUBS], 10), message);
    }
  } else if (parsedBody.callback === commands.RETURN_CALLBACK) {
    //when someone returns the book
    const rows = await googleSheetsUtils.getRows(config.BOOKS_SUBS);

    const subscriptionsForThisBook = rows
      .filter(row => parseInt(row[config.BOOKID_COLUMN_SUBS], 10) ===
        parsedBody.bookID)
      .filter(row => parseInt(row[config.CHATID_COLUMN_SUBS], 10) !==
        parsedBody.chatID)

    const bookTitle = subscriptionsForThisBook[0][config.TITLE_COLUMN_SUBS];
    const bookAuthor = subscriptionsForThisBook[0][config.AUTHOR_COLUMN_SUBS];
    const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
    const shelf = subscriptionsForThisBook[0][config.SHELF_COLUMN_SUBS];

    const message = `${userMessages.BOOK_RETURNED_NOTIFY_1}*${shelf}*:\n\n*${bookInfo}*\n\n${userMessages.BOOK_RETURNED_NOTIFY_2}`;

    //notify all that book is available again
    for (const subscription of subscriptionsForThisBook) {
      await telegramUtils.sendFormattedMessage(
        parseInt(subscription[config.CHATID_COLUMN_SUBS], 10), message);
    }
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: parsedBody,
    }, null, 2),
  };
};
