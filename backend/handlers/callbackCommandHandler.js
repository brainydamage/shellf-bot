const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require("npmlog");

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
  const transformedArrayLength = inputArray.length <= config.COLUMNS_NUMBER ?
    config.COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a fixed length of 8, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 7) of the transformed array to returnDate
  transformedArray[config.RETURN_COLUMN] = returnDate;

  return transformedArray;
}

function setProlongAndDeadlineDatesForRowArray(inputArray, prolongDate,
                                               deadlineDate) {
  const transformedArrayLength = inputArray.length <= config.COLUMNS_NUMBER ?
    config.COLUMNS_NUMBER : inputArray.length;

  // Create a new array with a length 9 or more, filled with null
  const transformedArray = new Array(transformedArrayLength).fill(null);

  // Set the last element (index 8) of the transformed array to prolongDate
  transformedArray[config.PROLONG_COLUMN] = prolongDate;

  // Set the second element (index 1) of the transformed array to deadlineDate
  transformedArray[config.DEADLINE_COLUMN] = deadlineDate;

  return transformedArray;
}

module.exports.returnBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const bookRow = await googleSheetsUtils.getRow(config.BOOKS_LOG,
      parsedBody.rowNumber, "A", "K");

    if (bookRow && bookRow.length < config.COLUMNS_NUMBER) {
      const returnDate = await timestampToHumanReadable(Date.now());
      const dataForRow = setReturnDateForRowArray(bookRow, returnDate);

      const range = `A${parsedBody.rowNumber}:Z${parsedBody.rowNumber}`;
      await googleSheetsUtils.updateRow(range, dataForRow);
      await telegramUtils.sendFormattedMessage(userMessages.BOOK_RETURNED,
        parsedBody);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, Username: %s, ChatID: %s',
        messages.BOOK_RETURNED, parsedBody.callback, parsedBody.bookID,
        parsedBody.username, parsedBody.chatID);

    } else {
      // Handle case where row was not found or double-click
      // console.warn(`${messages.WARN_RETURN_BOOK}`);
    }
  } catch (error) {
    log.error('callback-command-handler',
      `Reason: "%s", BookID: %s, Username: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_RETURN_BOOK, parsedBody.bookID, parsedBody.username,
      parsedBody.chatID, error.message);

    console.error(error);

    await telegramUtils.sendFormattedMessage(userMessages.SUPPORT, parsedBody);
  }
}

module.exports.prolongBook = async (parsedBody) => {
  await telegramUtils.deleteMessage(parsedBody);

  try {
    const bookRow = await googleSheetsUtils.getRow(config.BOOKS_LOG,
      parsedBody.rowNumber, "A", "K");

    if (bookRow && (bookRow.length < config.COLUMNS_NUMBER - 1 ||
        bookRow[config.PROLONG_COLUMN] === '') &&
      (bookRow.length < config.COLUMNS_NUMBER ||
        bookRow[config.RETURN_COLUMN] === '')) {

      const timestamp = body.callback_query.message.date;
      const deadlineDate = await add10DaysAndFormat(timestamp);
      const prolongDate = await timestampToHumanReadable(Date.now());

      const range = `A${parsedBody.rowNumber}:Z${parsedBody.rowNumber}`;
      const dataForRow = setProlongAndDeadlineDatesForRowArray(bookRow,
        prolongDate, deadlineDate);
      await googleSheetsUtils.updateRow(range, dataForRow);

      //todo date in bold, add shelf name to message (see borrowBook)
      await telegramUtils.sendFormattedMessage(
        `${userMessages.BOOK_BORROWED}${deadlineDate}`, parsedBody.chatID);

      log.info('callback-command-handler',
        'Success: "%s", Callback: %s, BookID: %s, Username: %s, ChatID: %s',
        messages.BOOK_PROLONGED, parsedBody.callback, parsedBody.bookID,
        parsedBody.username, parsedBody.chatID);

    } else {
      // Handle case where row was not found or double-click
      // console.warn(`${messages.WARN_PROLONG_BOOK}`);
    }
  } catch (error) {
    log.error('callback-command-handler',
      `Reason: "%s", BookID: %s, Username: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_PROLONG_BOOK, parsedBody.bookID, parsedBody.username,
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
