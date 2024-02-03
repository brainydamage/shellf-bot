const googleSheetsUtils = require("../utils/googleSheetsUtils");
const telegramUtils = require("../utils/telegramUtils");
const config = require("../constants/config");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require('../utils/customLogger');

function timestampToHumanReadable(timestamp) {
  const date = new Date(timestamp * 1000);

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Belgrade'
  };

  return date.toLocaleString('ru-RU', options);
}

function addOneMonthAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + 1); // Add one month

  // Check for month rollover (e.g., Jan 31 to Feb 28/29)
  if (date.getDate() !== originalDay) {
    date.setDate(0); // Set to the last day of the previous month
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth()
                                                                   // is
                                                                   // 0-indexed
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

module.exports.borrowBook = async (parsedBody) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateTime = timestampToHumanReadable(timestamp);
  const deadlineDate = addOneMonthAndFormat(timestamp);
  const data = [dateTime, deadlineDate, parsedBody.username, parsedBody.chatID,
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
    let message = `${userMessages.BOOK_BORROWED}*${deadlineDate}*`;
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
          shelf: bookRow[config.SHELF_COLUMN_LOG]
        };
        bookInfo = book.author ? `${book.title}, ${book.author}` : book.title;
        shelf = book.shelf;

        message += ` на полку *${book.shelf}*:\n\n${bookInfo}`;
      }
    }

    message += `${userMessages.BOOK_BORROWED_ENDING}`;

    await telegramUtils.deleteMessage(loaderMsg);
    await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

    log.info('base-command-handler',
      'Success: "%s", Command: %s, BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
      messages.BOOK_BORROWED, parsedBody.command, parsedBody.bookID, bookInfo,
      shelf, parsedBody.username, parsedBody.chatID);

  } catch (error) {
    if (error.message === messages.FAILED_SEND_TG) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_SEND_TG, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_READ_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_GET_BOOK_DATA, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_UPDATE_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_APPEND_ROW, parsedBody.username, parsedBody.chatID,
        error.message);
    } else {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_BORROW_BOOK, parsedBody.username, parsedBody.chatID,
        error.message);
    }

    console.error(error);

    await telegramUtils.sendAdminMessage(parsedBody, error.message);
  }
};

module.exports.subscribeBook = async (parsedBody) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateTime = timestampToHumanReadable(timestamp);
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

    log.info('base-command-handler',
      'Success: "%s", Command: %s, BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
      messages.BOOK_SUBSCRIBED, parsedBody.command, parsedBody.bookID, bookInfo,
      shelf, parsedBody.username, parsedBody.chatID);

  } catch (error) {
    if (error.message === messages.FAILED_SEND_TG) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_SEND_TG, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_READ_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_GET_BOOK_DATA, parsedBody.username, parsedBody.chatID,
        error.message);
    } else if (error.message === messages.FAILED_UPDATE_DB) {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_APPEND_ROW, parsedBody.username, parsedBody.chatID,
        error.message);
    } else {
      log.error('base-command-handler',
        `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
        messages.FAILED_SUBSCRIBE_BOOK, parsedBody.username, parsedBody.chatID,
        error.message);
    }

    console.error(error);

    await telegramUtils.sendAdminMessage(parsedBody, error.message);
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
        const rowNumber = i + 1;

        const bookToReturn = {
          bookID: bookID, bookInfo: bookInfo, rowNumber: rowNumber
        };

        arrayOfBooks.push(bookToReturn);
      }
    }

    await telegramUtils.deleteMessage(parsedBody);

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturn(parsedBody.chatID, arrayOfBooks);
    } else {
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        userMessages.NO_BOOK_TO_RETURN);
    }

  } catch (error) {
    log.error('base-command-handler',
      `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_RETURN_BOOK, parsedBody.username, parsedBody.chatID,
      error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
}

module.exports.emptyStart = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.EMPTY_START_COMMAND);
}

module.exports.wrongCommand = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.WRONG_COMMAND);
}

module.exports.showHelpMessage = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID, userMessages.HELP_COMMAND);
}

module.exports.support = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  const supportMessage = `${userMessages.DONATE}${config.TINKOFF_LINK}\n${config.PAYPAL_LINK}`;
  await telegramUtils.sendFormattedMessage(parsedBody.chatID, supportMessage);
}


module.exports.repeatedCommand = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
  // await telegramUtils.sendMessage(parsedBody.chatID,
  //   userMessages.REPEATED_COMMAND);
}