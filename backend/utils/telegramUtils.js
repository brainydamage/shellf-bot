const {Telegraf} = require('telegraf');
const keyboardUtils = require("../utils/keyboardUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");
const log = require('./customLogger');
const config = require("../constants/config");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);

async function deleteMessage(parsedBody) {
  const messageID = parsedBody.messageID;
  const chatID = parsedBody.chatID;

  if (messageID && chatID) {
    try {
      await bot.telegram.deleteMessage(chatID, messageID);
    } catch (error) {
      //log failed to delete tg message?
    }
  }
}

async function sendMessage(chatId, message) {
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    // console.error(error);
    // throw new Error(messages.FAILED_SEND_TG);
  }
}

async function sendFormattedMessage(message, parsedBody) {
  try {
    await bot.telegram.sendMessage(parsedBody.chatID, message, {
      parse_mode: "Markdown", disable_web_page_preview: true
    });
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_SEND_TG);
    // await sendAdminMessage(error.message);
  }
}

async function sendAdminMessage(errorMessage, parsedBody) {
  const commandName = parsedBody.command || parsedBody.callback;
  const adminChatID = config.ADMIN_CHAT_ID;
  const formattedUsername = parsedBody.username ?
    `username: @${parsedBody.username}` : 'unknown username';
  const adminMessage = `${userMessages.ADMIN_ERROR}${formattedUsername}, chatID: ${parsedBody.chatID}, command: ${commandName}, errorMessage: ${errorMessage}`;

  try {
    await bot.telegram.sendMessage(adminChatID, adminMessage);
  } catch (error) {
    log.error('telegram-utils',
      `Reason: "%s", Username: %s, ChatID: %s, ErrorMessage: %s`,
      messages.FAILED_SEND_TG_ADMIN, parsedBody.username, parsedBody.chatID,
      error.message);
  }
}

async function showBooksToReturn(chatId, arrayOfBooks) {
  let keyboardArray = await keyboardUtils.getDatesKeyboardArray(arrayOfBooks);

  try {
    await bot.telegram.sendMessage(chatId, userMessages.CHOOSE_BOOK, {
      reply_markup: {
        inline_keyboard: keyboardArray,
      },
    });
  } catch (error) {
    // console.error(error);
    // throw new Error(messages.FAILED_SEND_TG_KEYBOARD);
  }
}

async function remindToReturn(chatId, reminder) {
  let keyboardExtra;
  if (!reminder.prolonged) {
    const prolongKeyboard = await keyboardUtils.getProlongKeyboard(
      reminder.bookID, reminder.rowNumber);
    keyboardExtra = {
      reply_markup: {
        inline_keyboard: prolongKeyboard,
      },
    }
  }

  const bookInfo = reminder.author ? `${reminder.title}, ${reminder.author}` :
    reminder.title;
  const message = `${userMessages.REMINDER}${reminder.deadline}:\n\n${bookInfo}${userMessages.REMINDER_ENDING}`;

  try {
    if (keyboardExtra) {
      await bot.telegram.sendMessage(chatId, message, keyboardExtra);
    } else {
      await bot.telegram.sendMessage(chatId, message);
    }
  } catch (error) {
    // console.error(error);
    // throw new Error(messages.FAILED_SEND_TG_PROLONG);
  }
}

module.exports = {
  deleteMessage,
  sendMessage,
  sendFormattedMessage,
  sendAdminMessage,
  showBooksToReturn,
  remindToReturn
};