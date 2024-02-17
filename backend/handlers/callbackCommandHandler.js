const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");
const dateTimeUtils = require("../utils/dateTimeUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require('../utils/customLogger');

function setReturnDateForRowArray(inputArray, returnDate) {
  const transformedArrayLength = inputArray.length <=
  config.LOG_COLUMNS_NUMBER ? config.LOG_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length of 8, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 7) of the transformed array to returnDate
  transformedArray[config.RETURN_COLUMN_LOG] = returnDate;

  return transformedArray;
}

function setUnsubsDateForRowArray(inputArray, unsubsDate) {
  const transformedArrayLength = inputArray.length <=
  config.SUBS_COLUMNS_NUMBER ? config.SUBS_COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the unsubscribe column of the transformed array to returnDate
  transformedArray[config.UNSUBSCRIBE_COLUMN_SUBS] = unsubsDate;

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

async function getBookRowWithNumber(parsedBody, sheetName, prolong) {
  const rows = await googleSheetsUtils.getRows(sheetName);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    let chatIDColumn, bookIDColumn, dateColumn;

    if (sheetName === config.BOOKS_LOG) {
      chatIDColumn = config.CHATID_COLUMN_LOG;
      bookIDColumn = config.BOOKID_COLUMN_LOG;
      if (prolong) {
        dateColumn = config.PROLONG_COLUMN_LOG;
      } else {
        dateColumn = config.RETURN_COLUMN_LOG;
      }
    } else if (sheetName === config.BOOKS_SUBS) {
      chatIDColumn = config.CHATID_COLUMN_SUBS;
      bookIDColumn = config.BOOKID_COLUMN_SUBS;
      dateColumn = config.UNSUBSCRIBE_COLUMN_SUBS;
    }

    const sameChatID = row[chatIDColumn] === parsedBody.chatID.toString();
    const sameBookID = row[bookIDColumn] === parsedBody.bookID.toString();
    const dateIsEmpty = row[dateColumn] === '';

    if (sameChatID && sameBookID && dateIsEmpty) {
      return {bookRow: row, rowNumber: i + 1};
    }
  }
  return {bookRow: null, rowNumber: null};
}

module.exports.returnBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const result = await getBookRowWithNumber(parsedBody, config.BOOKS_LOG,
      false);
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

      const returnDate = dateTimeUtils.timestampToHumanReadable(
        Date.now() / 1000);
      const dataForRow = setReturnDateForRowArray(bookRow, returnDate);

      const range = `${config.BOOKS_LOG}!${result.rowNumber}:${result.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);
      await telegramUtils.sendFormattedMessage(parsedBody.chatID,
        `${userMessages.BOOK_RETURNED}\n\n${userMessages.DONATE}`);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, BookInfo: %s, DaysBorrowed: %s, Username: %s, ChatID: %s, Shelf: %s',
        messages.BOOK_RETURNED, parsedBody.callback, parsedBody.bookID,
        bookInfo, daysBorrowed, parsedBody.username, parsedBody.chatID, shelf);

      return true;
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
    const result = await getBookRowWithNumber(parsedBody, config.BOOKS_LOG,
      true);
    const bookRow = result.bookRow;

    if (bookRow && (bookRow.length < config.LOG_COLUMNS_NUMBER - 1 ||
        bookRow[config.PROLONG_COLUMN_LOG] === '') &&
      (bookRow.length < config.LOG_COLUMNS_NUMBER ||
        bookRow[config.RETURN_COLUMN_LOG] === '')) {

      //1706662735
      const timestamp = parsedBody.date;
      //'01.03.2024'
      const initialDeadline = bookRow[config.DEADLINE_COLUMN_LOG];

      const laterDateTimestamp = dateTimeUtils.getLaterDate(timestamp,
        initialDeadline);

      const newDeadlineDate = dateTimeUtils.addNDaysAndFormat(
        laterDateTimestamp, 7);
      const prolongDate = dateTimeUtils.timestampToHumanReadable(
        Date.now() / 1000);
      const dataForRow = setProlongAndDeadlineDatesForRowArray(bookRow,
        prolongDate, newDeadlineDate);

      const range = `${config.BOOKS_LOG}!${result.rowNumber}:${result.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);

      const bookTitle = bookRow[config.TITLE_COLUMN_LOG];
      const bookAuthor = bookRow[config.AUTHOR_COLUMN_LOG];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;

      const shelf = bookRow[config.SHELF_COLUMN_LOG];

      let message = `${userMessages.BOOK_BORROWED}*${newDeadlineDate}* на полку *${shelf}*:\n\n*${bookInfo}*${userMessages.BOOK_BORROWED_ENDING}`;
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

module.exports.unsubscribeBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const result = await getBookRowWithNumber(parsedBody, config.BOOKS_SUBS,
      false);
    const bookRow = result.bookRow;

    if (bookRow && (bookRow.length < config.SUBS_COLUMNS_NUMBER ||
      bookRow[config.UNSUBSCRIBE_COLUMN_SUBS] === '')) {
      const bookTitle = bookRow[config.TITLE_COLUMN_SUBS];
      const bookAuthor = bookRow[config.AUTHOR_COLUMN_SUBS];
      const bookInfo = bookAuthor ? `${bookTitle}, ${bookAuthor}` : bookTitle;
      const shelf = bookRow[config.SHELF_COLUMN_SUBS];

      const unsubsDate = dateTimeUtils.timestampToHumanReadable(
        Date.now() / 1000);
      const dataForRow = setUnsubsDateForRowArray(bookRow, unsubsDate);

      const range = `${config.BOOKS_SUBS}!${result.rowNumber}:${result.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);

      const message = `${userMessages.BOOK_UNSUBSCRIBED}\n\n${bookInfo}`;
      await telegramUtils.sendFormattedMessage(parsedBody.chatID, message);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, BookInfo: %s, Username: %s, ChatID: %s, Shelf: %s',
        messages.BOOK_UNSUBSCRIBED, parsedBody.callback, parsedBody.bookID,
        bookInfo, parsedBody.username, parsedBody.chatID, shelf);

    } else {
      // Handle case where row was not found or double-click
      // console.warn(`${messages.WARN_RETURN_BOOK}`);
    }
  } catch (error) {
    log.error('callback-command-handler',
      `Reason: "%s", Username: %s, BookID: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_UNSUBSCRIBE_BOOK, parsedBody.username, parsedBody.bookID,
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
