const googleSheetsUtils = require('../utils/googleSheetsUtils');
const telegramUtils = require('../utils/telegramUtils');
const dateTimeUtils = require('../utils/dateTimeUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const userMessages = require('../constants/userMessages');
const log = require('../utils/customLogger');

function setDuplicationMarkForRowArray(inputArray) {
  const transformedArrayLength = inputArray.length <=
  config.LOG_COLUMNS_NUMBER ? config.LOG_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length of config.LOG_COLUMNS_NUMBER,
  // filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 7) of the transformed array to returnDate
  transformedArray[config.RETURN_COLUMN_LOG] = 'дубль';

  return transformedArray;
}

module.exports.borrowBook = async (parsedBody) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateTime = dateTimeUtils.timestampToHumanReadable(timestamp);
  const deadlineDate = dateTimeUtils.addOneMonthAndFormat(timestamp);
  const data = [dateTime, deadlineDate, parsedBody.username, parsedBody.chatID,
    parsedBody.bookID];

  await telegramUtils.deleteMessage(parsedBody);

  const {
    message_id, chat: {id: chat_id},
  } = await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.BOOK_LOADER);
  const loaderMsg = {
    'messageID': message_id, 'chatID': chat_id,
  };

  try {
    let rowNumber;

    const response = await googleSheetsUtils.appendRow(config.BOOKS_LOG, data);
    const updatedRange = response.data.updates.updatedRange;
    const rowNumberRegex = /!A(\d+):/;
    const match = updatedRange.match(rowNumberRegex);

    let bookInfo;
    let shelf;
    if (match && match.length > 1) {
      rowNumber = parseInt(match[1], 10);

      const bookRow = await googleSheetsUtils.getRow(config.BOOKS_LOG,
        rowNumber);

      if (bookRow && parseInt(bookRow[config.BOOKID_COLUMN_LOG], 10) ===
        parsedBody.bookID) {
        // Found the book in the expected row
        const book = {
          title: bookRow[config.TITLE_COLUMN_LOG],
          author: bookRow[config.AUTHOR_COLUMN_LOG],
          shelf: bookRow[config.SHELF_COLUMN_LOG],
        };
        bookInfo = book.author ? `${book.title}, ${book.author}` : book.title;
        shelf = book.shelf;

        if (bookRow[config.DUPLICATED_COLUMN_LOG] === '') {
          //book borrowed
          const message = `${userMessages.BOOK_BORROWED}*${deadlineDate}* на полку *${book.shelf}*:\n\n*${bookInfo}*${userMessages.BOOK_BORROWED_ENDING}`;

          await telegramUtils.deleteMessage(loaderMsg);
          await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

          log.info('base-command-handler',
            'Success: "%s", Command: %s, BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
            messages.BOOK_BORROWED, parsedBody.command, parsedBody.bookID,
            bookInfo, shelf, parsedBody.username, parsedBody.chatID);

          return true;
        } else {
          //duplicate (same chatID+bookID in a table)
          const message = `${userMessages.DUPLICATED_BOOK}\n\n${userMessages.HOW_TO_RETURN}`;

          await telegramUtils.deleteMessage(loaderMsg);
          await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

          log.warn('base-command-handler',
            'Warning: "%s", Command: %s, BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
            messages.FAILED_BORROW_BOOK_DUPLICATION, parsedBody.command,
            parsedBody.bookID, bookInfo, shelf, parsedBody.username,
            parsedBody.chatID);

          const dataForRow = setDuplicationMarkForRowArray(bookRow);

          const range = `${config.BOOKS_LOG}!${rowNumber}:${rowNumber}`;
          await googleSheetsUtils.updateRow(range, dataForRow);

          return false;
        }
      }
    } else {
      await telegramUtils.deleteMessage(loaderMsg);
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        userMessages.SUPPORT);

      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
        messages.FAILED_BORROW_BOOK, parsedBody.username, parsedBody.chatID,
        parsedBody.bookID, messages.FAILED_GET_ROW_NUMBER);

      return false;
    }
  } catch (error) {
    if (error.message === messages.FAILED_SEND_TG) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
        messages.FAILED_SEND_TG, parsedBody.username, parsedBody.chatID,
        parsedBody.bookID, error.message);
    } else if (error.message === messages.FAILED_READ_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
        messages.FAILED_GET_BOOK_DATA, parsedBody.username, parsedBody.chatID,
        parsedBody.bookID, error.message);
    } else if (error.message === messages.FAILED_UPDATE_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
        messages.FAILED_APPEND_ROW, parsedBody.username, parsedBody.chatID,
        parsedBody.bookID, error.message);
    } else {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
        messages.FAILED_BORROW_BOOK, parsedBody.username, parsedBody.chatID,
        parsedBody.bookID, error.message);
    }

    console.error(error);

    await telegramUtils.sendAdminMessage(parsedBody, error.message);

    return false;
  }
};

module.exports.returnBook = async (parsedBody) => {
  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let arrayOfBooks = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const chatIDColumn = config.CHATID_COLUMN_LOG;
      const bookIDColumn = config.BOOKID_COLUMN_LOG;
      const returnDateColumn = config.RETURN_COLUMN_LOG;
      const titleColumn = config.TITLE_COLUMN_LOG;
      const authorColumn = config.AUTHOR_COLUMN_LOG;

      const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
      const isBookNotReturned = row[returnDateColumn] === '' || row.length <
        config.LOG_COLUMNS_NUMBER;

      if (sameChatID && isBookNotReturned) {
        const bookID = row[bookIDColumn];
        let bookTitle = row[titleColumn];
        let bookAuthor = row[authorColumn];

        if (!bookTitle) {
          const book = await googleSheetsUtils.getBookData(
            parseInt(bookID, 10));
          bookTitle = book.title;
          bookAuthor = book.author;
        }

        const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

        const bookToReturn = {
          bookID: bookID, bookInfo: bookInfo,
        };

        arrayOfBooks.push(bookToReturn);
      }
    }

    await telegramUtils.deleteMessage(parsedBody);

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturnOrUnsubs(parsedBody.chatID,
        arrayOfBooks, true);
    } else {
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        userMessages.NO_BOOK_TO_RETURN);
    }

  } catch (error) {
    log.error('base-command-handler',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_RETURN_BOOK, parsedBody.username, parsedBody.chatID,
      parsedBody.bookID, error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
};

module.exports.unsubscribeBook = async (parsedBody) => {
  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_SUBS);

    let arrayOfBooks = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const chatIDColumn = config.CHATID_COLUMN_SUBS;
      const bookIDColumn = config.BOOKID_COLUMN_SUBS;
      const titleColumn = config.TITLE_COLUMN_SUBS;
      const authorColumn = config.AUTHOR_COLUMN_SUBS;
      const unsubscribeDateColumn = config.UNSUBSCRIBE_COLUMN_SUBS;

      const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
      const isBookNotUnsubscribed = row[unsubscribeDateColumn] === '' ||
        row.length < config.SUBS_COLUMNS_NUMBER;

      if (sameChatID && isBookNotUnsubscribed) {
        const bookID = row[bookIDColumn];
        let bookTitle = row[titleColumn];
        let bookAuthor = row[authorColumn];

        if (!bookTitle) {
          const book = await googleSheetsUtils.getBookData(
            parseInt(bookID, 10));
          bookTitle = book.title;
          bookAuthor = book.author;
        }

        const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

        const bookToUnsubscribe = {
          bookID: bookID, bookInfo: bookInfo,
        };

        arrayOfBooks.push(bookToUnsubscribe);
      }
    }

    await telegramUtils.deleteMessage(parsedBody);

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturnOrUnsubs(parsedBody.chatID,
        arrayOfBooks, false);
    } else {
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        userMessages.NO_BOOK_TO_UNSUBSCRIBE);
    }

  } catch (error) {
    log.error('base-command-handler',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_UNSUBSCRIBE_BOOK, parsedBody.username, parsedBody.chatID,
      parsedBody.bookID, error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
};

module.exports.emptyStart = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.EMPTY_START_COMMAND);
};

module.exports.wrongCommand = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.WRONG_COMMAND);
};

module.exports.showHelpMessage = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID, userMessages.HELP_COMMAND);
};

module.exports.support = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  await telegramUtils.sendFormattedMessage(parsedBody.chatID,
    userMessages.DONATE);
};

module.exports.catalogue = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  await telegramUtils.showCatalogueButton(parsedBody.chatID);
};

module.exports.repeatedCommand = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  // await telegramUtils.sendMessage(parsedBody.chatID,
  //   userMessages.REPEATED_COMMAND);
};