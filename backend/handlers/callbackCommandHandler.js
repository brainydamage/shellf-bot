const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require('../utils/customLogger');

async function timestampToHumanReadable(timestamp) {
  const date = new Date(timestamp);

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

async function add10DaysAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  date.setDate(date.getDate() + 10); // Add 10 days

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear(); // Get year

  return `${day}.${month}.${year}`;
}

function setReturnDateForRowArray(inputArray, returnDate) {
  const transformedArrayLength = inputArray.length <=
  config.LOG_COLUMNS_NUMBER ? config.LOG_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length of 8, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 7) of the transformed array to returnDate
  transformedArray[config.RETURN_COLUMN_LOG] = returnDate;

  return transformedArray;
}

function setProlongAndDeadlineDatesForRowArray(inputArray, prolongDate,
                                               deadlineDate) {
  const transformedArrayLength = inputArray.length <=
  config.LOG_COLUMNS_NUMBER ? config.LOG_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a length 9 or more, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 8) of the transformed array to prolongDate
  transformedArray[config.PROLONG_COLUMN_LOG] = prolongDate;

  // Set the second element (index 1) of the transformed array to deadlineDate
  transformedArray[config.DEADLINE_COLUMN_LOG] = deadlineDate;

  return transformedArray;
}

module.exports.returnBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const bookRow = await googleSheetsUtils.getRow(config.BOOKS_LOG,
      parsedBody.rowNumber);

    if (bookRow && (bookRow.length < config.LOG_COLUMNS_NUMBER ||
      bookRow[config.RETURN_COLUMN_LOG] === '')) {
      const bookTitle = bookRow[config.TITLE_COLUMN_LOG];
      const bookAuthor = bookRow[config.AUTHOR_COLUMN_LOG];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
      const shelf = bookRow[config.SHELF_COLUMN_LOG];

      //24.12.2023, 16:55
      const dateBorrowedStr = bookRow[config.DATE_COLUMN_LOG];
      const dateBorrowedParts = dateBorrowedStr.split(', ');
      const [day, month, year] = dateBorrowedParts[0].split('.').map(Number);
      const [hours, minutes] = dateBorrowedParts[1].split(':').map(Number);

      const dateBorrowed = new Date(year, month - 1, day, hours, minutes);
      const currentDate = new Date();

      const timeDiff = currentDate.getTime() - dateBorrowed.getTime();
      const daysBorrowed = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const returnDate = await timestampToHumanReadable(Date.now());
      const dataForRow = setReturnDateForRowArray(bookRow, returnDate);

      const range = `${parsedBody.rowNumber}:${parsedBody.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);
      await telegramUtils.sendFormattedMessage(userMessages.BOOK_RETURNED,
        parsedBody);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, BookInfo: %s, DaysBorrowed: %s, Username: %s, ChatID: %s, Shelf: %s',
        messages.BOOK_RETURNED, parsedBody.callback, parsedBody.bookID,
        bookInfo, daysBorrowed, parsedBody.username, parsedBody.chatID, shelf);

    } else {
      // Handle case where row was not found or double-click
      // console.warn(`${messages.WARN_RETURN_BOOK}`);
    }
  } catch (error) {
    log.error('callback-command-handler',
      `Reason: "%s", Username: %s, BookID: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_RETURN_BOOK, parsedBody.username, parsedBody.bookID,
      parsedBody.chatID, error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(userMessages.SUPPORT, parsedBody);
  }
}

module.exports.prolongBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const bookRow = await googleSheetsUtils.getRow(config.BOOKS_LOG,
      parsedBody.rowNumber);

    //TODO is that actual with the new ID column (last one)?
    if (bookRow && (bookRow.length < config.LOG_COLUMNS_NUMBER - 1 ||
        bookRow[config.PROLONG_COLUMN_LOG] === '') &&
      (bookRow.length < config.LOG_COLUMNS_NUMBER ||
        bookRow[config.RETURN_COLUMN_LOG] === '')) {

      const timestamp = parsedBody.date;
      const deadlineDate = await add10DaysAndFormat(timestamp);
      const prolongDate = await timestampToHumanReadable(Date.now());

      const range = `${parsedBody.rowNumber}:${parsedBody.rowNumber}`;
      const dataForRow = setProlongAndDeadlineDatesForRowArray(bookRow,
        prolongDate, deadlineDate);
      await googleSheetsUtils.updateRow(range, dataForRow);

      const bookTitle = bookRow[config.TITLE_COLUMN_LOG];
      const bookAuthor = bookRow[config.AUTHOR_COLUMN_LOG];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

      const shelf = bookRow[config.SHELF_COLUMN_LOG];

      let message = `${userMessages.BOOK_BORROWED}*${deadlineDate}* на полку *${shelf}*:\n\n${bookInfo}${userMessages.BOOK_BORROWED_ENDING}`;
      await telegramUtils.sendFormattedMessage(message, parsedBody);

      //TODO add some fields to the log!!! see returnBook above
      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, BookInfo: %s, Username: %s, ChatID: %s, Shelf: %s, ',
        messages.BOOK_PROLONGED, parsedBody.callback, parsedBody.bookID,
        bookInfo, parsedBody.username, parsedBody.chatID, shelf);

    } else {
      // Handle case where row was not found or double-click
      // console.warn(`${messages.WARN_PROLONG_BOOK}`);
    }
  } catch (error) {
    log.error('callback-command-handler',
      `Reason: "%s", Username: %s, BookID: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_PROLONG_BOOK, parsedBody.username, parsedBody.bookID,
      parsedBody.chatID, error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(userMessages.SUPPORT, parsedBody);
  }
}

module.exports.cancel = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
}

module.exports.howToReturn = async (parsedBody) => {
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.HOW_TO_RETURN);
}
