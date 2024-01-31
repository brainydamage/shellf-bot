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

async function getLaterDate(date1Timestamp, date2String) {
  const timezoneOffset = 3600 * 1000; // 1 hour offset for GMT+1
  const date1Date = new Date((date1Timestamp * 1000) + timezoneOffset);

  const [day, month, year] = date2String.split('.').map(Number);
  const date2Date = new Date(year, month - 1, day);

  // Compare and return the later date in date1Timestamp format
  if (date2Date > date1Date) {
    return Math.floor(date2Date.getTime() / 1000);
  } else {
    return date1Timestamp;
  }
}

async function add7DaysAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  date.setDate(date.getDate() + 7); // Add 7 days

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

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

async function getBookRowWithNumber(parsedBody) {
  const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const chatIDColumn = config.CHATID_COLUMN_LOG;
    const bookIDColumn = config.BOOKID_COLUMN_LOG;

    const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
    const sameBookID = row[bookIDColumn] === parsedBody.bookID.toString();

    if (sameChatID && sameBookID) {
      return {bookRow: row, rowNumber: i + 1};
    }
  }
  return {bookRow: null, rowNumber: null};
}

module.exports.returnBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const result = await getBookRowWithNumber(parsedBody);
    const bookRow = result.bookRow;

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

      const range = `${result.rowNumber}:${result.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        userMessages.BOOK_RETURNED);

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

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
}

module.exports.prolongBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const result = await getBookRowWithNumber(parsedBody);
    const bookRow = result.bookRow;

    //TODO is that actual with the new ID column (last one)?
    if (bookRow && (bookRow.length < config.LOG_COLUMNS_NUMBER - 1 ||
        bookRow[config.PROLONG_COLUMN_LOG] === '') &&
      (bookRow.length < config.LOG_COLUMNS_NUMBER ||
        bookRow[config.RETURN_COLUMN_LOG] === '')) {

      //1706662735
      const timestamp = parsedBody.date;
      //'01.03.2024'
      const initialDeadline = bookRow[config.DEADLINE_COLUMN_LOG];

      const laterDateTimestamp = await getLaterDate(timestamp, initialDeadline);

      const newDeadlineDate = await add7DaysAndFormat(laterDateTimestamp);
      const prolongDate = await timestampToHumanReadable(Date.now());

      const range = `${result.rowNumber}:${result.rowNumber}`;
      const dataForRow = setProlongAndDeadlineDatesForRowArray(bookRow,
        prolongDate, newDeadlineDate);
      await googleSheetsUtils.updateRow(range, dataForRow);

      const bookTitle = bookRow[config.TITLE_COLUMN_LOG];
      const bookAuthor = bookRow[config.AUTHOR_COLUMN_LOG];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

      const shelf = bookRow[config.SHELF_COLUMN_LOG];

      let message = `${userMessages.BOOK_BORROWED}*${newDeadlineDate}* на полку *${shelf}*:\n\n${bookInfo}${userMessages.BOOK_BORROWED_ENDING}`;
      await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, BookInfo: %s, Username: %s, ChatID: %s, Shelf: %s',
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

    await telegramUtils.sendFormattedMessage(parsedBody.chatID,
      userMessages.SUPPORT);
  }
}

module.exports.cancel = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);
}

module.exports.howToReturn = async (parsedBody) => {
  await telegramUtils.sendMessage(parsedBody.chatID,
    userMessages.HOW_TO_RETURN);
}
