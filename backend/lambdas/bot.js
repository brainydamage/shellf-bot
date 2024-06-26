'use strict';
const messages = require('../constants/messages');
const commands = require('../constants/commands');
const config = require('../constants/config');
const baseCommandHandler = require('../handlers/baseCommandHandler');
const callbackCommandHandler = require('../handlers/callbackCommandHandler');
const log = require('../utils/customLogger');
const {LambdaClient, InvokeCommand} = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({region: config.REGION});

let userBookMap = {};

function parseBody(body) {
  let parsed = {
    lang: 'ru',
    date: null,
    messageID: null,
    chatID: null,
    username: 'no_username',
    command: null,
    subscribe: false,
    unsubscribe: false,
    callback: null,
    bookID: null,
    statusChange: null,
  };

  const lang = findLanguageCode(body);

  if (lang !== 'ru') {
    parsed.lang = 'eng';
  }

  if (body.message) {
    parsed.messageID = body.message.message_id;
    parsed.chatID = body.message.chat.id;
    parsed.username = body.message.from.username || 'no_username';
    parsed.command = body.message.text;

    const command = body.message.text;
    if (command.startsWith(commands.START)) {
      parsed.command = body.message.text.split(' ')[0];
      const parts = command.split(' ');
      if (parts.length === 2) {
        let parameter = parts[1];

        if (parameter.startsWith(commands.SUBSCRIBE)) {
          parsed.subscribe = true;
          parameter = parameter.split('_')[1];
        }

        if (/^\d+$/.test(parameter)) {
          parsed.bookID = parseInt(parameter, 10);
        }
      }
    }

  } else if (body.callback_query) {
    parsed.messageID = body.callback_query.message.message_id;
    parsed.chatID = body.callback_query.message.chat.id;
    parsed.date = body.callback_query.message.date;
    parsed.username = body.callback_query.from.username || 'no_username';
    parsed.callback = body.callback_query.data;

    // Generalized extraction of bookID from callback data
    const parts = parsed.callback.split('_');

    // Assuming format: _return_{bookID}
    if (parsed.callback.startsWith(commands.RETURN_CALLBACK) ||
      parsed.callback.startsWith(commands.PROLONG_CALLBACK) ||
      parsed.callback.startsWith(commands.UNSUBSCRIBE_CALLBACK)) {
      parsed.bookID = parseInt(parts[2], 10);

      // Construct the callback field, e.g. _return
      parsed.callback = parts[0] + '_' + parts[1];
    }
  } else if (body.my_chat_member) {
    parsed.chatID = body.my_chat_member.chat.id;
    parsed.username = body.my_chat_member.from.username || 'no_username';
    const oldStatus = body.my_chat_member.old_chat_member.status;
    const newStatus = body.my_chat_member.new_chat_member.status;

    if (oldStatus === 'member' && newStatus === 'kicked') {
      parsed.statusChange = 'bot_kicked';
    } else if (oldStatus === 'kicked' && newStatus === 'member') {
      parsed.statusChange = 'bot_unblocked';
    }
  }

  return parsed;
}

function findLanguageCode(data) {
  if (typeof data === 'object' && data !== null) {
    for (let key in data) {
      if (key === 'language_code') {
        return data[key];
      }
      let result = findLanguageCode(data[key]);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
}

async function invokeSubscriber(payload) {
  const params = {
    FunctionName: config.SUBSCRIBER_LAMBDA,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  };

  const command = new InvokeCommand(params);

  try {
    const response = await lambdaClient.send(command);

    console.log('Subscriber invoked successfully: HTTP', response.StatusCode);
  } catch (error) {
    console.error('Error invoking Subscriber:', error);
  }
}

async function invokeNotifier(payload) {
  const params = {
    FunctionName: config.NOTIFIER_LAMBDA,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  };

  const command = new InvokeCommand(params);

  try {
    const response = await lambdaClient.send(command);

    console.log('Notifier invoked successfully: HTTP', response.StatusCode);
  } catch (error) {
    console.error('Error invoking Notifier:', error);
  }
}

module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const parsedBody = parseBody(body);
  console.log(body);

  if (parsedBody.chatID === 0) {
    log.error('bot-interactions', 'chatID is null: %j', body);
  }

  if (parsedBody.username === 'no_username') {
    log.warn('bot-interactions', 'username is not set: %j', body);
  }

  // Check if the chat type is 'private'
  if (body.message && body.message.chat.type !== 'private' ||
    body.callback_query && body.callback_query.message.chat.type !==
    'private') {
    log.info('bot-interactions', 'non-private interaction skipped: %j', body);

    return {
      statusCode: 200,
      body: JSON.stringify({message: 'Non-private interaction, skipped'}),
    };
  }

  if (parsedBody.command) {
    log.info('bot-interactions',
      'Command: %s, BookID: %s, Username: %s, ChatID: %s', parsedBody.command,
      parsedBody.bookID, parsedBody.username, parsedBody.chatID);

    if (parsedBody.command.startsWith(commands.START)) {
      if (!parsedBody.bookID) {
        await baseCommandHandler.emptyStart(parsedBody);
      } else if (parsedBody.subscribe) {
        const userSubsBookKey = `${parsedBody.chatID}_subscribe_${parsedBody.bookID}`;

        if (userBookMap[userSubsBookKey]) {
          await baseCommandHandler.repeatedCommand(parsedBody);

          log.warn('bot-interactions',
            'Warning: %s, UserSubsBookKey: %s, BookID: %s, Username: %s, ChatID: %s',
            messages.WARN_DOUBLE_REQUEST, userSubsBookKey, parsedBody.bookID,
            parsedBody.username, parsedBody.chatID);

          return;
        }

        userBookMap[userSubsBookKey] = true;

        await invokeSubscriber(parsedBody);
      } else {
        const userBorrowBookKey = `${parsedBody.chatID}_${parsedBody.bookID}`;

        if (userBookMap[userBorrowBookKey]) {
          await baseCommandHandler.repeatedCommand(parsedBody);

          log.warn('bot-interactions',
            'Warning: %s, userBorrowBookKey: %s, BookID: %s, Username: %s, ChatID: %s',
            messages.WARN_DOUBLE_REQUEST, userBorrowBookKey, parsedBody.bookID,
            parsedBody.username, parsedBody.chatID);

          return;
        }

        userBookMap[userBorrowBookKey] = true;

        const borrowed = await baseCommandHandler.borrowBook(parsedBody);
        if (borrowed) {
          await invokeSubscriber(parsedBody);
          await invokeNotifier(parsedBody);
        }
      }
    } else if (parsedBody.command === commands.RETURN) {
      await baseCommandHandler.returnBook(parsedBody);
    } else if (parsedBody.command === commands.CATALOGUE) {
      await baseCommandHandler.catalogue(parsedBody);
    } else if (parsedBody.command === commands.UNSUBSCRIBE) {
      await baseCommandHandler.unsubscribeBook(parsedBody);
    } else if (parsedBody.command === commands.HELP) {
      await baseCommandHandler.showHelpMessage(parsedBody);
    } else if (parsedBody.command === commands.SUPPORT) {
      await baseCommandHandler.support(parsedBody);
    } else {
      await baseCommandHandler.wrongCommand(parsedBody);
    }

  } else if (parsedBody.callback) {
    log.info('bot-interactions',
      'Callback: %s, BookID: %s, Username: %s, ChatID: %s', parsedBody.callback,
      parsedBody.bookID, parsedBody.username, parsedBody.chatID);

    if (parsedBody.callback === commands.RETURN_CALLBACK) {
      const returned = await callbackCommandHandler.returnBook(parsedBody);
      if (returned) {
        await invokeSubscriber(parsedBody);
      }
    } else if (parsedBody.callback === commands.UNSUBSCRIBE_CALLBACK) {
      await callbackCommandHandler.unsubscribeBook(parsedBody);
    } else if (parsedBody.callback === commands.PROLONG_CALLBACK) {
      await callbackCommandHandler.prolongBook(parsedBody);
    } else if (parsedBody.callback === commands.CANCEL) {
      await callbackCommandHandler.cancel(parsedBody);
    } else if (parsedBody.callback === commands.HOW_TO_RETURN) {
      await callbackCommandHandler.howToReturn(parsedBody);
    }

  } else if (parsedBody.statusChange) {
    //user kicked or re-added the bot - what to do?
    log.info('bot-interactions',
      'StatusChange: %s, BookID: %s, Username: %s, ChatID: %s',
      parsedBody.statusChange, parsedBody.bookID, parsedBody.username,
      parsedBody.chatID);

  } else {
    log.warn('bot-interactions', `${messages.INVALID_PAYLOAD}: %j`, body);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};
