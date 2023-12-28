'use strict';
const messages = require('../constants/messages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');
const log = require('../utils/customLogger');

module.exports.handler = async (event) => {
  let requestedBookID = event.pathParameters.bookID;
  log.info('backend', 'Message: "%s", BookID: %s', messages.BOOK_REQUESTED,
    requestedBookID);

  // Check if requestedBookID is a valid integer
  requestedBookID = parseInt(requestedBookID, 10);
  if (isNaN(requestedBookID)) {
    log.warn('backend', 'Message: "%s", BookID: %s',
      messages.INVALID_BOOK_ID_FORMAT, event.pathParameters.bookID);

    return {
      statusCode: 404,
      body: JSON.stringify({message: messages.NOT_VALID_BOOK_ID}, null, 2),
    };
  }

  try {
    const book = await googleSheetsUtils.getBookData(requestedBookID);

    if (book) {
      const bookInfo = book.author ? `${book.title}, ${book.author}` :
        book.title;

      log.info('backend', 'Success: "%s", BookID: %s, BookInfo: %s',
        messages.BOOK_FOUND, requestedBookID, bookInfo);

      return {
        statusCode: 200, body: JSON.stringify({
          title: book.title, author: book.author,
        }, null, 2),
      };
    } else {
      log.error('backend', 'Reason: "%s", BookID: %s',
        messages.BOOK_NOT_FOUND, requestedBookID);

      return {
        statusCode: 404,
        body: JSON.stringify({message: messages.BOOK_NOT_FOUND}, null, 2),
      };
    }

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500, body: JSON.stringify({message: error.message}),
    };
  }
};
