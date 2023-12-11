'use strict';
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require('../utils/googleSheetsUtils');

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
    let book = await googleSheetsUtils.getBookData(requestedBookID);
    return await createResponse(book, requestedBookID);

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500, body: JSON.stringify({message: error.message}),
    };
  }
};
