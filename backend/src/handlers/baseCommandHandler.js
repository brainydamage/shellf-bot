const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");

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
        `успех! пожалуйста, верни книгу до ${deadlineDate}`);
    } catch (error) {
      console.error(`Failed to borrow a book`);
      console.error(error.message);
      console.error(error);
      if (error.message === 'Error updating database') {
        //send the help contact to user
      } else if (error.message === 'Failed to send telegram message') {
        //delete row from db and try send the help contact to user
      }
    }
  } else {
    console.error("The message does not contain a valid book id");
  }
};

module.exports.returnBook = async (chatID, body) => {
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
      const isBookNotReturned = row[returnDateColumn] === '' || row.length < 8;

      if (sameChatID && isBookNotReturned) {
        const bookID = row[bookIDColumn];
        const bookTitle = row[titleColumn];
        const bookAuthor = row[authorColumn];
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
    }

  } catch (error) {

  }
}
