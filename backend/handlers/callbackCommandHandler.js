const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const commands = require("../constants/commands");
const {logging} = require("googleapis/build/src/apis/logging");

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

function transformArray(inputArray, returnDate) {
  const returnDateLength = inputArray.length <= 8 ? 8 : inputArray.length;

  // Create a new array with a fixed length of 8, filled with null
  const transformedArray = new Array(returnDateLength).fill(null);

  // Set the last element (index 7) of the transformed array to returnDate
  transformedArray[7] = returnDate;

  return transformedArray;
}

module.exports.returnBook = async (chatID, body) => {
  await telegramUtils.deleteMessage(body);
  const username = body.callback_query.message.chat.username;

  try {
    const match = body.callback_query.data.match(/_return_(\d+)/);
    const bookID = match[1];

    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let bookRowIndex = -1;
    let bookRow = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] === bookID && (rows[i].length < 8 || rows[i][7] === '')) {
        bookRowIndex = i;
        bookRow = rows[i];
        break;
      }
    }

    const returnDate = await timestampToHumanReadable(Date.now());
    const range = `A${bookRowIndex + 1}:Z${bookRowIndex + 1}`;
    const data = transformArray(bookRow, returnDate);

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

      // This could include alternative ways to notify the error, like
      // sending an email alert or message to the team
      const adminChatID = config.ADMIN_CHAT_ID;
      const adminMessage = `${userMessages.ADMIN_ERROR}${username}, chatID: ${chatID}, команда: ${commands.RETURN_CALLBACK}`;
      await telegramUtils.sendMessage(adminChatID, adminMessage);
    }
  }
}
