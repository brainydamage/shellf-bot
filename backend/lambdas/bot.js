'use strict';
const messages = require('../constants/messages');
const commands = require('../constants/commands');
const baseCommandHandler = require('../handlers/baseCommandHandler');
const callbackCommandHandler = require('../handlers/callbackCommandHandler');
const log = require('npmlog');

function parseBody(body) {
  let parsed = {
    messageID: null,
    chatID: null,
    username: 'no_username',
    command: null,
    callback: null,
    bookID: null,
    statusChange: null,
  };

  if (body.message) {
    parsed.messageID = body.message.message_id;
    parsed.chatID = body.message.chat.id;
    parsed.username = body.message.from.username || 'no_username';
    parsed.command = body.message.text;

    // Extract bookID from /start command
    if (parsed.command.startsWith(commands.START)) {
      const parts = parsed.command.split(' ');
      if (parts.length === 2) {
        const potentialBookID = parts[1];
        if (/^\d+$/.test(potentialBookID)) {
          parsed.bookID = parseInt(potentialBookID, 10);
        }
      }
    }

  } else if (body.callback_query) {
    parsed.messageID = body.callback_query.message.message_id;
    parsed.chatID = body.callback_query.message.chat.id;
    parsed.username = body.callback_query.from.username || 'no_username';

    parsed.callback = body.callback_query.data;

    // Generalized extraction of bookID from callback data
    const parts = parsed.callback.split('_');
    const lastPart = parts[parts.length - 1];

    if (/^\d+$/.test(lastPart)) {
      // If the last part is a number, set it as bookID
      parsed.bookID = parseInt(lastPart, 10);
    }
  } else if (body.my_chat_member) {
    parsed.chatID = body.my_chat_member.chat.id;
    parsed.username = body.my_chat_member.from.username || 'no_username';
    const oldStatus = body.my_chat_member.old_chat_member.status;
    const newStatus = body.my_chat_member.new_chat_member.status;

    if (oldStatus === 'member' && newStatus === 'kicked') {
      parsed.statusChange = 'bot_kicked';
    } else if (oldStatus === 'kicked' && newStatus === 'member') {
      parsed.statusChange = 'bot_readded';
    }
  }

  return parsed;
}

module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const parsedBody = parseBody(body);
  // log.info('bot', 'parsed body: %j', parsedBody);

  let chatID = body.message ? body.message.chat.id :
    body.callback_query ? body.callback_query.message.chat.id :
      body.my_chat_member ? body.my_chat_member.chat.id : 0;

  if (parsedBody.chatID === 0) {
    log.error('bot', 'chatID is null: %j', body);
  }

  if (parsedBody.command) {
    log.info('bot-interactions',
      'command: %s, bookID: %s, username: %s, chatID: %s', parsedBody.command,
      parsedBody.bookID, parsedBody.username, parsedBody.chatID);

    if (parsedBody.command.startsWith(commands.START)) {
      if (!parsedBody.bookID) {
        await baseCommandHandler.emptyStart(parsedBody);
      } else {
        await baseCommandHandler.borrowBook(parsedBody);
      }
    } else if (parsedBody.command === commands.RETURN) {
      await baseCommandHandler.returnBook(parsedBody);
    } else if (parsedBody.command === commands.HELP) {
      await baseCommandHandler.showHelpMessage(parsedBody);
    } else if (parsedBody.command === commands.SUPPORT) {
      await baseCommandHandler.support(parsedBody);
    } else {
      await baseCommandHandler.wrongCommand(parsedBody);
    }

  } else if (parsedBody.callback) {
    if (parsedBody.callback.startsWith(commands.RETURN_CALLBACK)) {
      await callbackCommandHandler.returnBook(chatID, body);
    } else if (parsedBody.callback.startsWith(commands.PROLONG_CALLBACK)) {
      await callbackCommandHandler.prolongBook(chatID, body);
    } else if (parsedBody.callback === commands.CANCEL) {
      await callbackCommandHandler.cancel(chatID, body);
    } else if (parsedBody.callback === commands.HOW_TO_RETURN) {
      await callbackCommandHandler.howToReturn(chatID);
    }
  } else if (parsedBody.statusChange) {
    //user kicked or re-added the bot - what to do?
  } else {
    log.warn('bot', `${messages.INVALID_PAYLOAD}: %j`, body);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
