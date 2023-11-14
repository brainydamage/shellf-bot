const {Telegraf} = require('telegraf');

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);

module.exports.deleteMessage = async (body) => {
  let messageId = body.message.message_id;
  let chatId = body.message.from.id;

  if (messageId && chatId) {
    console.log(`deleting message with ID ${messageId}`);
    try {
      await bot.telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to delete telegram message');
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

// module.exports.requestPhoneNumber = async (chatId) => {
//     let message = strings.REQUEST_NUMBER;
//     await bot.telegram.sendMessage(chatId, message, {
//         reply_markup: {
//             resize_keyboard: true, one_time_keyboard: true, keyboard: [[{
//                 text: strings.SHARE_NUMBER, request_contact: true,
//             }, {
//                 text: strings.CANCEL_BUTTON, callback_data: `_cancel`,
//             },],],
//         },
//     });
// };

// // module.exports.deleteKeyboard = async (chatId, phoneNumber, error) => {
// //     let message;
// //     if (error) {
// //         console.log(`ERROR CASE IN SAVING PHONE NUMBER!`);
// //         message = `${strings.SAVE_NUMBER_ERROR}`;
// //         await bot.telegram.sendMessage(chatId, message, {
// //             reply_markup: {
// //                 remove_keyboard: true,
// //             },
// //         });
// //     } else {
// //         message = `${strings.SAVE_NUMBER} - ${phoneNumber}`;
// //         await bot.telegram.sendMessage(chatId, message, {
// //             reply_markup: {
// //                 remove_keyboard: true,
// //             },
// //         });
// //
// //         await bot.telegram.sendMessage(chatId, strings.WELCOME);
// //     }
// // };
//
// module.exports.askConfirmation =
//     async (chatId, eventID, eventDate, eventTime, isCancelation = false) =>
// {
//         let keyboardArray = await
// keyboardUtils.getConfirmationKeyboard(eventID, eventDate, eventTime,
// isCancelation);  const header = isCancelation ? strings.WANT_CANCEL :
// strings.CONFIRM_EVENT; const formattedDate = await
// dateUtils.yymmddToHumanDate(eventDate); let message =
// `${header}${formattedDate} в ${eventTime}`; await
// bot.telegram.sendMessage(chatId, message, { reply_markup: { inline_keyboard:
// keyboardArray, }, }); };