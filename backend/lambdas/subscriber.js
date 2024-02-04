'use strict';
const messages = require('../constants/messages');
const commands = require('../constants/commands');
const subscriberHandler = require('../handlers/subscriberHandler');
const log = require('../utils/customLogger');

module.exports.handler = async (parsedBody) => {
  console.log(parsedBody);

  if (parsedBody.subscribe) {
    await subscriberHandler.subscribeBook(parsedBody);
  } else if (parsedBody.unsubscribe) {

  } else {
    //get all rows from подписки
    //check if parsedBody.chatID is subscribed for parsedBody.bookID
    //if yes, unsubscribe

    //filter chatIDs from rows subscribed for parsedBody.bookID
    //notify all that book is not available
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: parsedBody,
    }, null, 2),
  };
};
