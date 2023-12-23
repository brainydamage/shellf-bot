const googleSheetsUtils = require("../utils/googleSheetsUtils");
const telegramUtils = require("../utils/telegramUtils");
const config = require("../constants/config");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const commands = require("../constants/commands");
const log = require('npmlog');

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

  date.setMonth(date.getMonth() + 1); // Add one month

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear(); // Get year

  return `${day}.${month}.${year}`;
}

async function sendMessage(username, chatID, message, commandName) {
  try {
    await telegramUtils.sendFormattedMessage(chatID, message);
  } catch (error) {
    log.error('base-command-handler',
      `Error: %s, Username: %s, ChatID: %s, Message: %s`,
      messages.FAILED_SEND_ERROR_TG, username, chatID, error.message);

    const adminChatID = config.ADMIN_CHAT_ID;
    username = username && `username: @${username}`;
    const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commandName}`;
    await telegramUtils.sendMessage(adminChatID, adminMessage);
  }
}

module.exports.borrowBook = async (parsedBody) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateTime = timestampToHumanReadable(timestamp);
  const deadlineDate = addOneMonthAndFormat(timestamp);
  const data = [dateTime, deadlineDate, parsedBody.username, parsedBody.chatID,
    parsedBody.bookID];

  await telegramUtils.deleteMessageNew(parsedBody);

  let message = `${userMessages.BOOK_BORROWED}*${deadlineDate}*`;
  let rowNumber;

  try {
    const response = await googleSheetsUtils.appendRow(config.BOOKS_LOG, data);
    const updatedRange = response.data.updates.updatedRange;
    const rowNumberRegex = /!A(\d+):/;
    const match = updatedRange.match(rowNumberRegex);

    if (match && match.length > 1) {
      rowNumber = parseInt(match[1], 10);

      try {
        const row = await googleSheetsUtils.getRow(config.BOOKS_LOG, rowNumber,
          "E", "H");
        if (row && parseInt(row[0], 10) === parsedBody.bookID) {
          // Found the book in the expected row
          const book = {title: row[1], author: row[2], shelf: row[3]};
          const bookInfo = book.author ? `${book.title}, ${book.author}` :
            book.title;

          message += ` на полку *${book.shelf}*:\n\n${bookInfo}`;
        }

      } catch (innerError) {
        log.error('base-command-handler',
          `Error: %s, Username: %s, ChatID: %s, Message: %s`,
          messages.FAILED_GET_BOOK_DATA, parsedBody.username, parsedBody.chatID,
          innerError.message);

        console.log(innerError);
      }

    } else {
      log.error('base-command-handler',
        `Error: %s, Username: %s, ChatID: %s, updatedRange: %s`,
        messages.INVALID_ROW_NUMBER, parsedBody.username, parsedBody.chatID,
        updatedRange);
    }

  } catch (error) {
    log.error('base-command-handler',
      `Error: %s, Username: %s, ChatID: %s, Message: %s`,
      messages.FAILED_BORROW_BOOK, parsedBody.username, parsedBody.chatID,
      error.message);

    console.log(error);

    await sendMessage(parsedBody.username, parsedBody.chatID,
      userMessages.SUPPORT, commands.START);
    return;
  }

  message += `${userMessages.BOOK_BORROWED_ENDING}`;
  await sendMessage(parsedBody.username, parsedBody.chatID, message,
    commands.START);
};

module.exports.returnBook = async (parsedBody) => {
  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let arrayOfBooks = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const chatIDColumn = config.CHATID_COLUMN;
      const bookIDColumn = config.BOOKID_COLUMN;
      const returnDateColumn = config.RETURN_COLUMN;
      const titleColumn = config.TITLE_COLUMN_LOG;
      const authorColumn = config.AUTHOR_COLUMN_LOG;

      const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
      const isBookNotReturned = row[returnDateColumn] === '' || row.length <
        config.COLUMNS_NUMBER;

      if (sameChatID && isBookNotReturned) {
        const bookID = row[bookIDColumn];
        let bookTitle = row[titleColumn];
        let bookAuthor = row[authorColumn];

        if (!bookTitle) {
          log.info('base-command-handler',
            `message: "%s", bookID: %s, rowNumber: %s`,
            messages.EMPTY_TITLE_LOG, bookID, i + 1);

          const book = await googleSheetsUtils.getBookData(
            parseInt(bookID, 10));
          bookTitle = book.title;
          bookAuthor = book.author;
        }

        const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

        const bookToReturn = {
          [bookID]: `${bookInfo}`
        }
        arrayOfBooks.push(bookToReturn);
      }
    }

    await telegramUtils.deleteMessageNew(parsedBody);

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturn(parsedBody.chatID, arrayOfBooks);
    } else {
      log.info('base-command-handler',
        `message: "%s", username: %s, chatID: %s`, messages.NO_BOOK_RETURN,
        parsedBody.username, parsedBody.chatID);

      await sendMessage(parsedBody.username, parsedBody.chatID,
        userMessages.NO_BOOK_TO_RETURN, commands.RETURN);
    }

  } catch (error) {
    log.error('base-command-handler',
      `Error: %s, Username: %s, ChatID: %s, Message: %s`,
      messages.FAILED_RETURN_BOOK, parsedBody.username, parsedBody.chatID,
      error.message);

    await sendMessage(parsedBody.username, parsedBody.chatID,
      userMessages.NO_BOOK_TO_RETURN, commands.RETURN);
  }
}

module.exports.emptyStart = async (parsedBody) => {
  await telegramUtils.deleteMessageNew(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.EMPTY_START_COMMAND);
}

module.exports.wrongCommand = async (parsedBody) => {
  await telegramUtils.deleteMessageNew(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.WRONG_COMMAND);
}

module.exports.showHelpMessage = async (parsedBody) => {
  await telegramUtils.deleteMessageNew(parsedBody);
  await telegramUtils.sendMessage(parsedBody.chatID, userMessages.HELP_COMMAND);
}

module.exports.support = async (parsedBody) => {
  await telegramUtils.deleteMessageNew(parsedBody);

  const supportMessage = `${userMessages.DONATE}${config.TINKOFF_LINK}\n${config.PAYPAL_LINK}`;
  await telegramUtils.sendFormattedMessage(parsedBody.chatID, supportMessage);
}