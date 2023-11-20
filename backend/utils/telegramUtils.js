const {Telegraf} = require('telegraf');
const keyboardUtils = require("../utils/keyboardUtils");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);

module.exports.deleteMessage = async (body) => {
  let messageId = body.message?.message_id ||
    body.callback_query?.message?.message_id;
  let chatId = body.message?.from?.id || body.callback_query?.from?.id;

  if (messageId && chatId) {
    console.log(`deleting message with ID ${messageId}`);
    try {
      await bot.telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error(error);
      // throw new Error('Failed to delete telegram message');
    }
  } else if (messageId) {
    console.error(`No chat with ID ${chatId}`);
  } else if (chatId) {
    console.error(`No message with ID ${messageId}`);
  }
};

module.exports.sendMessage = async (chatId, message) => {
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send telegram message');
  }
};

module.exports.showBooksToReturn = async (chatId, arrayOfBooks) => {
  let keyboardArray = await keyboardUtils.getDatesKeyboardArray(arrayOfBooks);

  const message = `Выбери книгу, которую хочешь вернуть:`;
  await bot.telegram.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: keyboardArray,
    },
  });
};