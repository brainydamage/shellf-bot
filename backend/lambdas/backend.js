'use strict';
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');

module.exports.handler = async (event) => {
  console.log(messages.BACKEND_HANDLER_TRIGGER);
  let requestedBookID = event.pathParameters.bookID;

  // Check if requestedBookID is 'any' or a valid integer
  if (requestedBookID !== config.ANY) {
    requestedBookID = parseInt(requestedBookID, 10);
    if (isNaN(requestedBookID)) {
      console.warn(
        `${messages.INVALID_BOOK_ID_FORMAT}${event.pathParameters.bookID}`);
      return {
        statusCode: 404,
        body: JSON.stringify({message: messages.NOT_VALID_BOOK_ID}, null, 2),
      };
    }
  }

  let bookTitle = "";
  let bookAuthor = "";

  const idColumn = config.ID_COLUMN;
  const titleColumn = config.TITLE_COLUMN;
  const authorColumn = config.AUTHOR_COLUMN;

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_DB);

    if (requestedBookID === config.ANY) {
      if (rows.length > 0) {
        const randomIndex = Math.floor(Math.random() * rows.length);
        const randomRow = rows[randomIndex];
        bookTitle = randomRow[titleColumn];
        bookAuthor = randomRow[authorColumn];
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({message: messages.NO_BOOKS_AVAILABLE}, null, 2),
        };
      }
    } else if (rows && rows.length > 0 && requestedBookID !== 0) {
      let bookFound = false;

      // Check if requestedBookID is within the range and matches the bookID
      if (requestedBookID < rows.length) {
        const row = rows[requestedBookID];
        if (!isNaN(row[idColumn])) {
          const bookID = parseInt(row[idColumn], 10);

          if (bookID === requestedBookID) {
            bookTitle = row[titleColumn];
            bookAuthor = row[authorColumn];
            bookFound = true;
          }
        } else {
          console.warn(
            `1 ${messages.INVALID_BOOK_ID_DATABASE}: value ${row[idColumn]}, raw ${requestedBookID}`);
        }
      }

      // If not found directly, search through all rows
      if (!bookFound) {
        console.log(
          `${requestedBookID}${messages.WRONG_PLACE}`);

        let isFirstRow = true;
        for (const row of rows) {
          if (isFirstRow) {
            isFirstRow = false;
            continue;
          }

          let currentBookID = parseInt(row[idColumn], 10);
          if (isNaN(currentBookID)) {
            console.warn(
              `2 ${messages.INVALID_BOOK_ID_DATABASE}: value ${row[idColumn]}, raw ${requestedBookID}`);
          } else if (currentBookID === requestedBookID) {
            bookTitle = row[titleColumn];
            bookAuthor = row[authorColumn];
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error(messages.FAILED_ACCESS_DB);
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({message: messages.ERROR_ACCESS_DB}),
    };
  }

  console.log(`${bookTitle} by ${bookAuthor}`);

  return (bookTitle !== '') ?
    {
      statusCode: 200,
      body: JSON.stringify({
        title: bookTitle,
        author: bookAuthor,
      }, null, 2),
    } :
    {
      statusCode: 400,
      body: JSON.stringify({message: messages.BOOK_NOT_FOUND}, null, 2),
    };
}
;
