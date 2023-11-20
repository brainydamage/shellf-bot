'use strict';
const messages = require('../constants/messages');
const baseCommandHandler = require('../handlers/baseCommandHandler');
const callbackCommandHandler = require('../handlers/callbackCommandHandler');

module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log(messages.BOT_HANDLER_TRIGGER);
  console.log(JSON.stringify(body));

  let chatID = body.message ?
    body.message.chat.id :
    body.callback_query ?
      body.callback_query.message.chat.id :
      body.my_chat_member ? body.my_chat_member.chat.id : 0;

  console.log(`chatID is ${chatID}`);
  if (chatID === 0) {
    console.error(`!!! CHAT ID IS NULL !!!`);
  }

  if (body && body.message && body.message.text) {
    if (body.message.text.startsWith('/start')) {
      await baseCommandHandler.borrowBook(chatID, body);
    } else if (body.message.text.startsWith('/return')) {
      await baseCommandHandler.returnBook(chatID, body);
    } else {
      // Handle other text messages
      // Your code here

    }


  } else if (body && body.callback_query) {
    const callbackQuery = body.callback_query;
    const data = callbackQuery.data;
    if (data.startsWith('_return_')) {
      // Handle the step when user selects the book to return
      await callbackCommandHandler.returnBook(chatID, body);
    }
  } else {
    console.warn("the payload is strange");
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
