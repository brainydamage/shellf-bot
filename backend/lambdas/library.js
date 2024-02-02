'use strict';
const messages = require('../constants/messages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');
const log = require('../utils/customLogger');

module.exports.handler = async () => {
  log.info('library', 'Message: "%s"', messages.BOOK_LIST_REQUESTED);

  try {
    const books = await googleSheetsUtils.getBooks();

    if (books.length > 0) {
      log.info('library', 'Success: "%s", Books Number: %s',
        messages.BOOK_LIST_RECEIVED, books.length);

      return {
        statusCode: 200, body: JSON.stringify({
          books
        }, null, 2),
      };
    } else {
      log.error('library', 'Reason: "%s"', messages.BOOK_LIST_EMPTY);

      return {
        statusCode: 404,
        body: JSON.stringify({message: messages.BOOK_LIST_EMPTY}, null, 2),
      };
    }

  } catch (error) {
    log.error('library', `Reason: "%s", ErrorMessage: %s`,
      messages.FAILED_GET_BOOKS_LIST, error.message);

    return {
      statusCode: 500, body: JSON.stringify({message: error.message}),
    };
  }
};
