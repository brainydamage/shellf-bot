'use strict';
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');

async function fetchAllBooks() {
  try {
    return await googleSheetsUtils.getRows(config.BOOKS_DB);
  } catch (error) {
    console.error(`${messages.FAILED_READ_DB} ${error.message}`);
    throw new Error(messages.FAILED_READ_DB);
  }
}

async function fetchRequestedBook(rowNumber) {
  try {
    return await googleSheetsUtils.getRow(config.BOOKS_DB, rowNumber);
  } catch (error) {
    console.error(`${messages.FAILED_READ_DB} ${error.message}`);
    throw new Error(messages.FAILED_READ_DB);
  }
}

async function extractBookDetails(row) {
  const bookTitle = row[config.TITLE_COLUMN];
  const bookAuthor = row[config.AUTHOR_COLUMN];
  return {title: bookTitle, author: bookAuthor};
}

async function linearSearchForBook(requestedBookID) {
  console.log(messages.WRONG_PLACE);
  const rows = await fetchAllBooks();
  return await processBookData(rows, requestedBookID);
}

async function processBookData(rows, requestedBookID) {
  let bookTitle = "";
  let bookAuthor = "";

  // If 'any' is requested, return a random book
  if (requestedBookID === config.ANY) {
    if (rows.length > 0) {
      const randomIndex = Math.floor(Math.random() * rows.length);
      const randomRow = rows[randomIndex];
      bookTitle = randomRow[config.TITLE_COLUMN];
      bookAuthor = randomRow[config.AUTHOR_COLUMN];
      return {title: bookTitle, author: bookAuthor};
    }
    return null;
  }

  // Search for a specific book by ID
  for (const row of rows) {
    const currentBookID = parseInt(row[config.ID_COLUMN], 10);
    if (!isNaN(currentBookID) && currentBookID === requestedBookID) {
      bookTitle = row[config.TITLE_COLUMN];
      bookAuthor = row[config.AUTHOR_COLUMN];
      return {title: bookTitle, author: bookAuthor};
    }
  }

  // Book not found
  return null;
}

async function createResponse(book, requestedBookID) {
  if (!book) {
    console.error(`${messages.BOOK_NOT_FOUND}: id=${requestedBookID}`);
    return {
      statusCode: 404,
      body: JSON.stringify({message: messages.BOOK_NOT_FOUND}, null, 2),
    };
  }
  return {
    statusCode: 200, body: JSON.stringify({
      title: book.title, author: book.author,
    }, null, 2),
  };
}

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

  try {
    let book;
    const row = await fetchRequestedBook(requestedBookID + 1);
    if (row && parseInt(row[config.ID_COLUMN], 10) === requestedBookID) {
      // Found the book in the expected row
      book = await extractBookDetails(row);
    } else {
      // Fallback to linear search
      book = await linearSearchForBook(requestedBookID);
    }

    return await createResponse(book, requestedBookID);

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500, body: JSON.stringify({message: error.message}),
    };
  }
};
