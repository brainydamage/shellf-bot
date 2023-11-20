const googleSheetsUtils = require("../utils/googleSheetsUtils");
const config = require("../constants/config");
const telegramUtils = require("../utils/telegramUtils");

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

  try {
    const match = body.callback_query.data.match(/_return_(\d+)/);
    const bookID = match[1];

    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let bookRowIndex = -1;
    let bookRow = null;

    for (let i = 1; i < rows.length; i++) {

      if (rows[i][4] === bookID) {
        bookRowIndex = i;
        bookRow = rows[i];
        break;
      }
    }

    const returnDate = await timestampToHumanReadable(Date.now());
    const range = `A${bookRowIndex + 1}:Z${bookRowIndex + 1}`;
    const data = transformArray(bookRow, returnDate);
    await googleSheetsUtils.updateRow(range, data);

    const message = `Спасибо, что вернул:а книгу на полку!`
    await telegramUtils.sendMessage(chatID, message);
  } catch (error) {
    console.error(`Failed to return a book`);
    console.error(error.message);
    console.error(error);
    if (error.message === 'Error reading database') {
      //send the help contact to user
    } else if (error.message === 'Error updating database') {
      //send the help contact to user
    } else if (error.message === 'Failed to send telegram message') {
      //delete row from db and try send the help contact to user
    }
  }
}
