const googleSheetsUtils = require("../utils/googleSheetsUtils");
const telegramUtils = require("../utils/telegramUtils");
const config = require("../constants/config");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const commands = require("../constants/commands");

async function timestampToHumanReadable(timestamp) {
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

async function addOneMonthAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  date.setMonth(date.getMonth() + 1); // Add one month

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear(); // Get year

  return `${day}.${month}.${year}`;
}

module.exports.borrowBook = async (chatID, body) => {
  const bodyMessage = body.message;
  const match = bodyMessage.text.match(/\/start (\d+)/);
  let bookID;
  if (match && match[1]) {
    bookID = parseInt(match[1], 10);
    const username = bodyMessage.from.username;
    const timestamp = bodyMessage.date;
    const dateTime = await timestampToHumanReadable(timestamp);
    const deadlineDate = await addOneMonthAndFormat(timestamp);
    const data = [dateTime, deadlineDate, username, chatID, bookID];

    await telegramUtils.deleteMessage(body);

    try {

      await googleSheetsUtils.appendRow(config.BOOKS_LOG, data);
      await telegramUtils.sendMessage(chatID,
        `${userMessages.BOOK_BORROWED}${deadlineDate}${userMessages.BOOK_BORROWED_ENDING}`);

    } catch (error) {
      console.error(messages.FAILED_BORROW_BOOK);
      console.error(error.message);
      console.error(error);

      try {
        await telegramUtils.sendMessage(chatID, userMessages.SUPPORT);
      } catch (nestedError) {
        console.error(messages.FAILED_SEND_ERROR_TG);
        console.error(nestedError.message);
        console.error(nestedError);

        // This could include alternative ways to notify the error, like
        // sending an email alert or message to the team
        const adminChatID = config.ADMIN_CHAT_ID;
        const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commands.START}`;
        await telegramUtils.sendMessage(adminChatID, adminMessage);
      }
    }
  } else {
    console.error(messages.INVALID_BOOK_ID_BODY);
  }
};

module.exports.returnBook = async (chatID, body) => {
  const username = body.message.from.username;

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let arrayOfBooks = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      console.log(row);

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

        const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` :
          `${bookTitle}`;

        const bookToReturn = {
          [bookID]: `${bookInfo}`
        }
        arrayOfBooks.push(bookToReturn);
      }
    }

    if (arrayOfBooks.length > 0) {
      await telegramUtils.showBooksToReturn(chatID, arrayOfBooks);
    } else {
      await telegramUtils.sendMessage(chatID, userMessages.NO_BOOK_TO_RETURN);
    }

  } catch (error) {
    console.error(messages.FAILED_RETURN_BOOK);
    console.error(error.message);
    console.error(error);

    try {
      await telegramUtils.sendMessage(chatID, userMessages.SUPPORT);
    } catch (nestedError) {
      console.error(messages.FAILED_SEND_ERROR_TG);
      console.error(nestedError.message);
      console.error(nestedError);

      // This could include alternative ways to notify the error, like
      // sending an email alert or message to the team
      const adminChatID = config.ADMIN_CHAT_ID;
      const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commands.RETURN}`;
      await telegramUtils.sendMessage(adminChatID, adminMessage);
    }

  }
}

module.exports.wrongCommand = async (chatID, body) => {
  await telegramUtils.deleteMessage(body);
  await telegramUtils.sendMessage(chatID, userMessages.WRONG_COMMAND);
}