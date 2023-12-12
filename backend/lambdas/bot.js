'use strict';
const messages = require('../constants/messages');
const commands = require('../constants/commands');
const baseCommandHandler = require('../handlers/baseCommandHandler');
const callbackCommandHandler = require('../handlers/callbackCommandHandler');

module.exports.handler = async (event) => {
  console.log(messages.BOT_HANDLER_TRIGGER);

  const body = JSON.parse(event.body);
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
    if (body.message.text.startsWith(commands.START)) {
      await baseCommandHandler.borrowBook(chatID, body);
    } else if (body.message.text.startsWith(commands.RETURN)) {
      await baseCommandHandler.returnBook(chatID, body);
    } else {
      await baseCommandHandler.wrongCommand(chatID, body);
    }

  } else if (body && body.callback_query && body.callback_query.data) {
    const data = body.callback_query.data;
    if (data.startsWith(commands.RETURN_CALLBACK)) {
      // Handle the step when user selects the book to return
      await callbackCommandHandler.returnBook(chatID, body);
    } else if (data.startsWith(commands.PROLONG_CALLBACK)) {
      // Handle the step when user prolongs the book
      await callbackCommandHandler.prolongBook(chatID, body);
    }
  } else {
    console.warn(messages.INVALID_PAYLOAD);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
