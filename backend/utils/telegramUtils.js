const {Telegraf} = require('telegraf');
const keyboardUtils = require("../utils/keyboardUtils");
const messages = require("../constants/messages");
const userMessages = require("../constants/userMessages");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);

module.exports.deleteMessage = async (body) => {
  let messageId = body.message?.message_id ||
    body.callback_query?.message?.message_id;
  let chatId = body.message?.from?.id || body.callback_query?.from?.id;

  if (messageId && chatId) {
    console.log(`${messages.DELETING_MSG_TG}${messageId}`);
    try {
      await bot.telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error(error);
      // throw new Error('Failed to delete telegram message');
    }
  } else if (messageId) {
    console.error(`${messages.NO_CHAT_TG}${chatId}`);
  } else if (chatId) {
    console.error(`${messages.NO_MESSAGE_TG}${messageId}`);
  }
};

module.exports.sendMessage = async (chatId, message) => {
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    throw new Error(messages.FAILED_SEND_TG);
  }
};

module.exports.showBooksToReturn = async (chatId, arrayOfBooks) => {
  let keyboardArray = await keyboardUtils.getDatesKeyboardArray(arrayOfBooks);

  try {
    await bot.telegram.sendMessage(chatId, userMessages.CHOOSE_BOOK, {
      reply_markup: {
        inline_keyboard: keyboardArray,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error(messages.FAILED_SEND_TG_KEYBOARD);
  }
};

module.exports.remindToReturn = async (chatId, reminder) => {
  let keyboardExtra;
  if (!reminder.prolonged) {
    const prolongKeyboard = await keyboardUtils.getProlongKeyboard(
      reminder.bookID);
    keyboardExtra = {
      reply_markup: {
        inline_keyboard: prolongKeyboard,
      },
    }
  }

  const bookInfo = reminder.author ? `${reminder.title}, ${reminder.author}` :
    reminder.title;
  const message = `${userMessages.REMINDER}${bookInfo}${userMessages.REMINDER_ENDING}`;

  try {
    if (keyboardExtra) {
      await bot.telegram.sendMessage(chatId, message, keyboardExtra);
    } else {
      await bot.telegram.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error(error);
    throw new Error(messages.FAILED_SEND_TG_PROLONG);
  }
};