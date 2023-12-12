const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const commands = require("../constants/commands");

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

module.exports.returnBook = async (chatID, body) => {
  await telegramUtils.deleteMessage(body);
  const username = body.callback_query.message.chat.username;

  try {
    const match = body.callback_query.data.match(/_return_(\d+)/);
    const bookID = match[1];

    console.log(`${chatID}${messages.BOOK_RETURN_ID}${bookID}`);

    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let bookRowIndex = -1;
    let bookRow = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][config.CHATID_COLUMN] === chatID.toString() &&
        rows[i][config.BOOKID_COLUMN] === bookID &&
        (rows[i].length < config.COLUMNS_NUMBER ||
          rows[i][config.RETURN_COLUMN] === '')) {
        bookRowIndex = i;
        bookRow = rows[i];
        break;
      }
    }

    const returnDate = await timestampToHumanReadable(Date.now());
    const range = `A${bookRowIndex + 1}:Z${bookRowIndex + 1}`;
    const data = setReturnDateForRowArray(bookRow, returnDate);

    await googleSheetsUtils.updateRow(range, data);
    await telegramUtils.sendMessage(chatID, userMessages.BOOK_RETURNED);

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

      const adminChatID = config.ADMIN_CHAT_ID;
      const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commands.RETURN_CALLBACK}`;
      await telegramUtils.sendMessage(adminChatID, adminMessage);
    }
  }
}

module.exports.prolongBook = async (chatID, body) => {
  await telegramUtils.deleteMessage(body);
  const username = body.callback_query.message.chat.username;

  try {
    const match = body.callback_query.data.match(/_prolong_(\d+)/);
    const bookID = match[1];

    console.log(`${chatID}${messages.BOOK_PROLONG}${bookID}`);

    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let bookRowIndex = -1;
    let bookRow = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][config.CHATID_COLUMN] === chatID.toString() &&
        rows[i][config.BOOKID_COLUMN] === bookID &&
        (rows[i].length < config.COLUMNS_NUMBER - 1 ||
          rows[i][config.PROLONG_COLUMN] === '') &&
        (rows[i].length < config.COLUMNS_NUMBER ||
          rows[i][config.RETURN_COLUMN] === '')) {
        bookRowIndex = i;
        bookRow = rows[i];
        break;
      }
    }

    const timestamp = body.callback_query.message.date;
    const deadlineDate = await add10DaysAndFormat(timestamp);
    const prolongDate = await timestampToHumanReadable(Date.now());

    const range = `A${bookRowIndex + 1}:Z${bookRowIndex + 1}`;
    const data = setProlongAndDeadlineDatesForRowArray(bookRow, prolongDate,
      deadlineDate);

    await googleSheetsUtils.updateRow(range, data);
    await telegramUtils.sendMessage(chatID,
      `${userMessages.BOOK_BORROWED}${deadlineDate}`);

  } catch (error) {
    console.error(messages.FAILED_PROLONG_BOOK);
    console.error(error.message);
    console.error(error);

    try {
      await telegramUtils.sendMessage(chatID, userMessages.SUPPORT);
    } catch (nestedError) {
      console.error(messages.FAILED_SEND_ERROR_TG);
      console.error(nestedError.message);
      console.error(nestedError);

      const adminChatID = config.ADMIN_CHAT_ID;
      const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commands.PROLONG_CALLBACK}`;
      await telegramUtils.sendMessage(adminChatID, adminMessage);
    }
  }
}

module.exports.cancel = async (chatID, body) => {
  console.log(`${chatID}${messages.CANCELED}`);

  await telegramUtils.deleteMessage(body);
}
