'use strict';
const messages = require('../constants/messages');
const commands = require('../constants/commands');
const config = require('../constants/config');
const baseCommandHandler = require('../handlers/baseCommandHandler');
const callbackCommandHandler = require('../handlers/callbackCommandHandler');
const log = require('../utils/customLogger');
const {LambdaClient, InvokeCommand} = require("@aws-sdk/client-lambda");

const lambdaClient = new LambdaClient({region: config.REGION});

let userBookMap = {};

function parseBody(body) {
  let parsed = {
    date: null,
    messageID: null,
    chatID: null,
    username: 'no_username',
    command: null,
    subscribe: false,
    unsubscribe: false,
    callback: null,
    rowNumber: null,
    bookID: null,
    statusChange: null,
  };

  if (body.message) {
    parsed.messageID = body.message.message_id;
    parsed.chatID = body.message.chat.id;
    parsed.username = body.message.from.username || 'no_username';
    parsed.command = body.message.text.split(' ')[0];

    const command = body.message.text;
    if (command.startsWith(commands.START)) {
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

    // Assuming format: _return_{bookID}_row{rowNumber}
    if ((parsed.callback.startsWith(commands.RETURN_CALLBACK) ||
        parsed.callback.startsWith(commands.PROLONG_CALLBACK)) && parts.length ===
      4) {
      parsed.bookID = parseInt(parts[2], 10);

      // Extract rowNumber from the last part
      const rowPart = parts[parts.length - 1];
      const rowNumberMatch = rowPart.match(/^row(\d+)$/);
      if (rowNumberMatch && rowNumberMatch[1]) {
        parsed.rowNumber = parseInt(rowNumberMatch[1], 10);
      }

      // Construct the callback field
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

module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const parsedBody = parseBody(body);

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
      body: JSON.stringify({message: "Non-private interaction, skipped"}),
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

        await baseCommandHandler.borrowBook(parsedBody);
        await invokeSubscriber(parsedBody);
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
    log.info('bot-interactions',
      'Callback: %s, BookID: %s, Username: %s, ChatID: %s', parsedBody.callback,
      parsedBody.bookID, parsedBody.username, parsedBody.chatID);

    if (parsedBody.callback === commands.RETURN_CALLBACK) {
      await callbackCommandHandler.returnBook(parsedBody);
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
