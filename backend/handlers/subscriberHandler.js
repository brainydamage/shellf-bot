const googleSheetsUtils = require("../utils/googleSheetsUtils");
const telegramUtils = require("../utils/telegramUtils");
const dateTimeUtils = require("../utils/dateTimeUtils");
const config = require("../constants/config");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require('../utils/customLogger');

function setUnsubsDateForRowArray(inputArray, unsubsDate) {
  const transformedArrayLength = inputArray.length <=
  config.SUBS_COLUMNS_NUMBER ? config.SUBS_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the unsubscribe column of the transformed array to returnDate
  transformedArray[config.UNSUBSCRIBE_COLUMN_SUBS] = unsubsDate;

  return transformedArray;
}

module.exports.subscribeBook = async (parsedBody) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateTime = dateTimeUtils.timestampToHumanReadable(timestamp);
  const data = [dateTime, parsedBody.username, parsedBody.chatID,
    parsedBody.bookID];

  await telegramUtils.deleteMessage(parsedBody);

  const {
    message_id, chat: {id: chat_id}
  } = await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.BOOK_LOADER);
  const loaderMsg = {
    'messageID': message_id, 'chatID': chat_id,
  };

  try {
    let message = `${userMessages.BOOK_SUBSCRIBED}`;
    let rowNumber;

    const response = await googleSheetsUtils.appendRow(config.BOOKS_SUBS, data);
    const updatedRange = response.data.updates.updatedRange;
    const rowNumberRegex = /!A(\d+):/;
    const match = updatedRange.match(rowNumberRegex);

    let bookInfo;
    let shelf;
    if (match && match.length > 1) {
      rowNumber = parseInt(match[1], 10);

      const bookRow = await googleSheetsUtils.getRow(config.BOOKS_SUBS,
        rowNumber);

      if (bookRow && parseInt(bookRow[config.BOOKID_COLUMN_SUBS], 10) ===
        parsedBody.bookID) {
        // Found the book in the expected row
        const book = {
          title: bookRow[config.TITLE_COLUMN_SUBS],
          author: bookRow[config.AUTHOR_COLUMN_SUBS],
          shelf: bookRow[config.SHELF_COLUMN_SUBS]
        };
        bookInfo = book.author ? `${book.title}, ${book.author}` : book.title;
        shelf = book.shelf;

        message += `\n\n*${bookInfo}*\n\n`;
      }
    }

    message += `${userMessages.BOOK_SUBSCRIBED_ENDING}*${shelf}* 🐌`;

    await telegramUtils.deleteMessage(loaderMsg);
    await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

    log.info('subscriber-handler',
      'Success: "%s", Command: %s, BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
      messages.BOOK_SUBSCRIBED, parsedBody.command, parsedBody.bookID, bookInfo,
      shelf, parsedBody.username, parsedBody.chatID);

  } catch (error) {
    if (error.message === messages.FAILED_SEND_TG) {
      log.error('subscriber-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_SEND_TG, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_READ_DB) {
      log.error('subscriber-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_GET_BOOK_DATA, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_UPDATE_DB) {
      log.error('subscriber-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_APPEND_ROW, parsedBody.username, parsedBody.chatID,
        error.message);
    } else {
      log.error('subscriber-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_SUBSCRIBE_BOOK, parsedBody.username, parsedBody.chatID,
        error.message);
    }

    console.error(error);

    await telegramUtils.sendAdminMessage(parsedBody, error.message);
  }
};

module.exports.unsubscribeUserFromBorrowedBook = async (rows, parsedBody) => {
  try {
    let bookToUnsubscribe;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const chatIDColumn = config.CHATID_COLUMN_SUBS;
      const bookIDColumn = config.BOOKID_COLUMN_SUBS;
      const unsubscribeDateColumn = config.UNSUBSCRIBE_COLUMN_SUBS;

      const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
      const sameBookID = row[bookIDColumn] === parsedBody.bookID.toString();
      const isBookNotUnsubscribed = row[unsubscribeDateColumn] === '' ||
        row.length < config.SUBS_COLUMNS_NUMBER;

      if (sameChatID && sameBookID && isBookNotUnsubscribed) {
        bookToUnsubscribe = {
          bookRow: row, rowNumber: i + 1,
        };
      }
    }

    if (bookToUnsubscribe) {
      const unsubsDate = dateTimeUtils.timestampToHumanReadable(
        Date.now() / 1000);
      const dataForRow = setUnsubsDateForRowArray(bookToUnsubscribe.bookRow,
        unsubsDate);

      const bookTitle = bookToUnsubscribe.bookRow[config.TITLE_COLUMN_SUBS];
      const bookAuthor = bookToUnsubscribe.bookRow[config.AUTHOR_COLUMN_SUBS];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
      const shelf = bookToUnsubscribe.bookRow[config.SHELF_COLUMN_SUBS];

      const range = `${config.BOOKS_SUBS}!${bookToUnsubscribe.rowNumber}:${bookToUnsubscribe.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);

      log.info('subscriber-handler',
        'Success: "%s", Command: %s, BookID: %s, BookInfo: %s, Username: %s, ChatID: %s, Shelf: %s',
        messages.BOOK_UNSUBSCRIBED_HIDDEN, parsedBody.command,
        parsedBody.bookID,
        bookInfo, parsedBody.username, parsedBody.chatID, shelf);
    }
  } catch (error) {
    log.error('subscriber-handler',
      `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_UNSUBSCRIBE_BOOK, parsedBody.username, parsedBody.chatID,
      error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
}