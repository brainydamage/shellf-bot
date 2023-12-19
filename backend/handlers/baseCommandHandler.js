const googleSheetsUtils = require("../utils/googleSheetsUtils");
const telegramUtils = require("../utils/telegramUtils");
const config = require("../constants/config");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const commands = require("../constants/commands");

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
    console.error(messages.FAILED_SEND_ERROR_TG);
    console.error(error.message);
    console.error(error);

    const adminChatID = config.ADMIN_CHAT_ID;
    username = username && `username: @${username}`;
    const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commandName}`;
    await telegramUtils.sendMessage(adminChatID, adminMessage);
  }
}

module.exports.borrowBook = async (chatID, body) => {
  const bodyMessage = body.message;
  const match = bodyMessage.text.match(/\/start (\d+)/);

  if (match && match[1]) {
    const bookID = parseInt(match[1], 10);
    console.log(`${chatID}${messages.BOOK_BORROW}${bookID}`);

    if (isNaN(bookID)) {
      console.error(
        `${messages.INVALID_BOOK_ID_BODY}: ${bodyMessage.text}, chatID: ${chatID}`);
      return;
    }

    const username = bodyMessage.from.username;
    const timestamp = bodyMessage.date;
    const dateTime = timestampToHumanReadable(timestamp);
    const deadlineDate = addOneMonthAndFormat(timestamp);
    const data = [dateTime, deadlineDate, username, chatID, bookID];

    await telegramUtils.deleteMessage(body);

    let message = `${userMessages.BOOK_BORROWED}*${deadlineDate}*`;
    let rowNumber;

    try {
      const response = await googleSheetsUtils.appendRow(config.BOOKS_LOG,
        data);
      const updatedRange = response.data.updates.updatedRange;
      const rowNumberRegex = /!A(\d+):/;
      const match = updatedRange.match(rowNumberRegex);

      if (match && match.length > 1) {
        rowNumber = parseInt(match[1], 10);

        try {
          const row = await googleSheetsUtils.getRow(config.BOOKS_LOG,
            rowNumber,
            "E", "H");
          if (row && parseInt(row[0], 10) === bookID) {
            // Found the book in the expected row
            const book = {title: row[1], author: row[2], shelf: row[3]};
            const bookInfo = book.author ? `${book.title}, ${book.author}` :
              book.title;

            message += ` на полку *${book.shelf}*:\n\n${bookInfo}`;
          }

        } catch (innerError) {
          console.error(messages.FAILED_GET_BOOK_DATA);
          console.error(innerError.message);
          console.error(innerError);
        }

      } else {
        console.error(messages.INVALID_ROW_NUMBER);
      }

    } catch (error) {
      console.error(messages.FAILED_BORROW_BOOK);
      console.error(error.message);
      console.error(error);

      await sendMessage(username, chatID, userMessages.SUPPORT, commands.START);
      return;
    }

    message += `${userMessages.BOOK_BORROWED_ENDING}`;
    await sendMessage(username, chatID, message, commands.START);

  } else {
    console.error(
      `${messages.INVALID_BOOK_ID_BODY}: ${bodyMessage.text}, chatID: ${chatID}`);
  }
};

module.exports.returnBook = async (chatID, body) => {
  console.log(`${chatID}${messages.BOOK_RETURN}`);

  const username = body.message.from.username;

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

      const sameChatID = row[chatIDColumn] === chatID.toString();
      const isBookNotReturned = row[returnDateColumn] === '' || row.length <
        config.COLUMNS_NUMBER;

      if (sameChatID && isBookNotReturned) {
        const bookID = row[bookIDColumn];
        let bookTitle = row[titleColumn];
        let bookAuthor = row[authorColumn];

        if (!bookTitle) {
          console.log(messages.EMPTY_TITLE_LOG);
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

    await telegramUtils.deleteMessage(body);

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturn(chatID, arrayOfBooks);
    } else {
      console.log(`${chatID}${messages.NO_BOOK_RETURN}`);

      await sendMessage(username, chatID, userMessages.NO_BOOK_TO_RETURN,
        commands.RETURN);
    }

  } catch (error) {
    console.error(messages.FAILED_RETURN_BOOK);
    console.error(error.message);
    console.error(error);

    await sendMessage(username, chatID, userMessages.NO_BOOK_TO_RETURN,
      commands.RETURN);
  }
}

module.exports.emptyStart = async (chatID, body) => {
  console.log(`${chatID}${messages.EMPTY_START}`);

  await telegramUtils.deleteMessage(body);
  await telegramUtils.sendMessage(chatID, userMessages.EMPTY_START_COMMAND);
}

module.exports.wrongCommand = async (chatID, body) => {
  console.log(`${chatID}${messages.WRONG_COMMAND}${body.message.text}`);

  await telegramUtils.deleteMessage(body);
  await telegramUtils.sendMessage(chatID, userMessages.WRONG_COMMAND);
}

module.exports.showHelpMessage = async (chatID, body) => {
  console.log(`${chatID}${messages.HELP_COMMAND}`);

  await telegramUtils.deleteMessage(body);
  await telegramUtils.sendMessage(chatID, userMessages.HELP_COMMAND);
}

module.exports.support = async (chatID, body) => {
  console.log(`${chatID}${messages.SUPPORT_COMMAND}`);

  await telegramUtils.deleteMessage(body);

  const supportMessage = `${userMessages.DONATE}${config.TINKOFF_LINK}\n${config.PAYPAL_LINK}`;
  await telegramUtils.sendFormattedMessage(chatID, supportMessage);
}