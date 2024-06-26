const {Telegraf} = require('telegraf');
const keyboardUtils = require('../utils/keyboardUtils');
const messages = require('../constants/messages');
const userMessages = require('../constants/userMessages');
const log = require('./customLogger');
const config = require('../constants/config');

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);

function escapeMarkdown(text) {
  return text.replace(/([_*[\]()`])/g, '\\$1');
}

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
    return await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    // console.error(error);
    // throw new Error(messages.FAILED_SEND_TG);
  }
}

async function sendFormattedMessage(chatID, message) {
  try {
    return await bot.telegram.sendMessage(chatID, message, {
      parse_mode: 'Markdown', disable_web_page_preview: true,
    });
  } catch (error) {
    throw new Error(messages.FAILED_SEND_TG);
  }
}

async function sendAdminMessage(parsedBody, errorMessage) {
  const commandName = parsedBody.command || parsedBody.callback;
  const adminChatID = config.ADMIN_CHAT_ID;
  const formattedUsername = parsedBody.username ?
    `username: @${parsedBody.username}` : 'unknown username';
  const adminMessage = `${userMessages.ADMIN_ERROR}${formattedUsername}, chatID: ${parsedBody.chatID}, command: ${commandName}, errorMessage: ${errorMessage}`;

  try {
    return await bot.telegram.sendMessage(adminChatID, adminMessage);
  } catch (error) {
    log.error('telegram-utils',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_SEND_TG_ADMIN, parsedBody.username, parsedBody.chatID,
      parsedBody.bookID, error.message);
  }
}

async function showBooksToReturnOrUnsubs(chatId, arrayOfBooks, returnBook) {
  let keyboardArray = await keyboardUtils.getDatesKeyboardArray(arrayOfBooks,
    returnBook);

  try {
    const message = returnBook ? userMessages.CHOOSE_BOOK_RETURN :
      userMessages.CHOOSE_BOOK_UNSUBSCRIBE;
    await bot.telegram.sendMessage(chatId, message, {
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
      parse_mode: 'Markdown', reply_markup: {
        inline_keyboard: prolongKeyboard,
      },
    };
  }

  const bookInfo = reminder.author ? `${reminder.title}, ${reminder.author}` :
    reminder.title;
  const message = `${userMessages.REMINDER}*${reminder.deadline}* на полку *${reminder.shelf}*:\n\n*${bookInfo}*${userMessages.REMINDER_ENDING}`;

  try {
    if (keyboardExtra) {
      await bot.telegram.sendMessage(chatId, message, keyboardExtra);
    } else {
      await bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
    }
  } catch (error) {
    log.error('telegram-utils',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_SEND_TG_REMINDER, reminder.username, reminder.chatID,
      reminder.bookID, error.message);

    // throw new Error(messages.FAILED_SEND_TG_REMINDER);
  }
}

async function reportOverdue(reminder) {
  const bookInfo = reminder.author ? `${reminder.title}, ${reminder.author}` :
    reminder.title;
  const username = reminder.username !== 'no_username' ?
    `*username:* @${escapeMarkdown(reminder.username)}` :
    `chatID: ${reminder.chatID}`;
  const message = `${userMessages.REPORT_OVERDUE}*книга:* ${bookInfo}\n${username}\n*дедлайн:* ${reminder.deadline}`;

  try {
    await bot.telegram.sendMessage(config.SUPPORT_CHAT_ID, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    log.error('telegram-utils',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_SEND_TG_REPORT, reminder.username, reminder.chatID,
      reminder.bookID, error.message);

    // throw new Error(messages.FAILED_SEND_TG_REMINDER);
  }
}

async function remindOverdue(chatId, reminder) {
  const bookInfo = reminder.author ? `${reminder.title}, ${reminder.author}` :
    reminder.title;
  const message = `${userMessages.REMINDER_OVERDUE_1}*${reminder.deadline}*${userMessages.REMINDER_OVERDUE_2}\n\n*${bookInfo}*\n\n${userMessages.REMINDER_OVERDUE_3}*${reminder.shelf}*${userMessages.REMINDER_OVERDUE_4}${userMessages.REMINDER_OVERDUE_5}`;

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    log.error('telegram-utils',
      `Reason: "%s", Username: %s, ChatID: %s, BookID: %s, ErrorMessage: %s`,
      messages.FAILED_SEND_TG_OVERDUE_LOST, reminder.username, reminder.chatID,
      reminder.bookID, error.message);

    // throw new Error(messages.FAILED_SEND_TG_REMINDER);
  }
}

async function showCatalogueButton(chatId) {
  try {
    return await bot.telegram.sendMessage(chatId, userMessages.CATALOGUE, {
      reply_markup: {
        inline_keyboard: [[{
          text: 'открыть каталог',
          web_app: {url: 'https://d30noal47qv51w.cloudfront.net'},
        }]],
      },
    });
  } catch (error) {
    throw new Error(messages.FAILED_SEND_TG);
  }
}

module.exports = {
  deleteMessage,
  sendMessage,
  sendFormattedMessage,
  sendAdminMessage,
  showBooksToReturnOrUnsubs,
  remindToReturn,
  remindOverdue,
  reportOverdue,
  showCatalogueButton,
};