const config = require("./config");

// module.exports = {
//   BUTTON_OPEN_CATALOGUE: `открыть каталог`,
//   BUTTON_CANCEL: `отмена`,
//   BUTTON_PROLONG: `продлить на 1 неделю`,
//   BUTTON_HOW_TO_RETURN: `как вернуть?`,
//
//   BOOK_LOADER: `записываем... пожалуйста, подожди!`,
//   REPEATED_COMMAND: `эту книгу мы уже записали!`,
//   BOOK_BORROWED: `привет, записали! не забудь вернуть книгу до `,
//   BOOK_BORROWED_ENDING: `\n\nприятного чтения 🐌`,
//   BOOK_SUBSCRIBED: `привет! добавили тебя в список ожидания на книгу:`,
//   BOOK_SUBSCRIBED_ENDING: `пришлём сообщение, как только книга вернётся на
// полку `, BOOK_UNSUBSCRIBED: `удалили тебя из списка ожидания на книгу:`,
// WRONG_COMMAND: `такой команды не существует 🫣`, HELP_COMMAND: `если у тебя
// iPhone, пожалуйста, закрой чат с ботом перед тем, как отсканировать qr-код
// на обложке. есть баги, которые нам не поправить🤖\n\nнаписать человеку:
// @shellllllf 🤖`, EMPTY_START_COMMAND: `чтобы взять книгу, отсканируй qr-код
// с обложки`, CHOOSE_BOOK_RETURN: `выбери книгу, которую хочешь вернуть:`,
// CHOOSE_BOOK_UNSUBSCRIBE: `выбери книгу, от которой хочешь отписаться:`,
// BOOK_RETURNED: `спасибо, что вернул:а книгу на полку!`,
// BOOK_BORROWED_NOTIFY_1: `привет! книгу, на которую ты подписан:а, только что
// забрали с полки `, BOOK_BORROWED_NOTIFY_2: `мы обязательно сообщим, как только книга вновь станет доступна 🐌`, BOOK_RETURNED_NOTIFY_1: `привет! отличные новости! книга, на которую ты подписан:а, снова на полке `, BOOK_RETURNED_NOTIFY_2: `🐌`,  SUPPORT: `кажется, что-то пошло не так. напиши, пожалуйста, в поддержку: @shellllllf 🤖`, NO_BOOK_TO_RETURN: `кажется, ты ещё не взял:а ни одной книги. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`, NO_BOOK_TO_UNSUBSCRIBE: `кажется, у тебя нет ни одной подписки на книгу. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`, DUPLICATED_BOOK: `кажется, ты уже читаешь эту книгу.\n\nесли это не так или ты пытаешься продлить книгу, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,  BOOK_NOT_MARKED_AS_RETURNED_1: `кажется, ты забыл:а отметить, что сдал:а книгу:\n\n`, BOOK_NOT_MARKED_AS_RETURNED_2: `чтобы вернуть книгу, поставь её на полку `, BOOK_NOT_MARKED_AS_RETURNED_3: `, а потом нажми на кнопку «вернуть книгу» в меню этого бота 🤝`, BOOK_NOT_MARKED_AS_RETURNED_4: `если что-то пошло не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,  ADMIN_ERROR: `bot\n\nчто-то пошло не так у пользователя:\n`,  REMINDER: `привет! не забудь вернуть книгу до `, REMINDER_ENDING: `\n\nдругие читател:ьницы уже ее заждались, а для тебя на наших полках, возможно, появилось что-то новое интересное 🐌`, HOW_TO_RETURN: `чтобы вернуть книгу, поставь её на полку shell(f), а потом нажми на кнопку «вернуть книгу» в меню этого бота 🤝`,  REMINDER_OVERDUE_1: `привет! похоже, одну книгу всё ещё нужно вернуть на полку. срок возврата истёк `, REMINDER_OVERDUE_2: `, поэтому напоминаем о ней:`, REMINDER_OVERDUE_3: `если ты дочитал:а книгу, пожалуйста, поставь её на полку `, REMINDER_OVERDUE_4: ` и нажми на кнопку «вернуть книгу» в меню этого бота 🐌\n\n`, REMINDER_OVERDUE_5: `если у тебя возникли какие-то сложности с возвратом, напиши нам в @shellllllf — всегда готовы помочь!🙏🏻`,  REPORT_OVERDUE: `в интернете опять кто-то неправ, а в библиотеке опять кто-то проебался:\n\n`,  DONATE: `поддержать работу библиотеки донейшеном:\n[tinkoff](${config.TINKOFF_LINK})\n[paypal](${config.PAYPAL_LINK})`,  CATALOGUE: `здесь можно увидеть все книги библиотеки, а также какие из них доступны на полках Nekrasova и Flat прямо сейчас\n\nесли нужную тебе книгу ещё кто-то читает, в каталоге есть опция подписки: подписавшись на книгу, ты узнаешь, когда она снова вернётся на полку 🐌`,  NOTIFICATION: `привет! в нашем боте появилась новая кнопка!\n/catalogue - смотреть каталог/подписаться на книгу\n\nнажав на неё, можно увидеть все книги библиотеки, а также какие из них доступны на полках Nekrasova и Flat прямо сейчас\n\nесли нужную тебе книгу ещё кто-то читает, в каталоге есть опция подписки: подписавшись на книгу, ты узнаешь, когда она снова вернётся на полку\n\nпожалуйста, не забывай отмечаться в боте, когда берёшь и возвращаешь книгу, чтобы информация в каталоге была актуальной 🙏`, };

const userMessages = {
  en: {
    BUTTON_OPEN_CATALOGUE: `open catalogue`,
    BUTTON_CANCEL: `cancel`,
    BUTTON_PROLONG: `prolong for 1 week`,
    BUTTON_HOW_TO_RETURN: `how to return?`,

    BOOK_LOADER: `processing... please, wait`,
    REPEATED_COMMAND: `this book has already been recorded!`,
    BOOK_BORROWED: `hey, got it! please, return the book by `,
    BOOK_BORROWED_ENDING: `\n\nenjoy the reading 🐌`,
    BOOK_SUBSCRIBED: `hey! put you on the waiting list for the book:`,
    BOOK_SUBSCRIBED_ENDING: `we'll let you know when the book is back on the shelf `,
    BOOK_UNSUBSCRIBED: `we removed you from the waiting list for the book:`,
    WRONG_COMMAND: `that command doesn't exist 🫣`,
    HELP_COMMAND: `if you have an iPhone, please close chat with the bot before scanning the qr code on the cover. there are bugs we can't fix🤖\n\ncontact us: @shellllllf 🤖`,
    EMPTY_START_COMMAND: `scan the qr code on the cover to take the book`,
    CHOOSE_BOOK_RETURN: `pick the book you want to return:`,
    CHOOSE_BOOK_UNSUBSCRIBE: `pick the book you want to unsubscribe from:`,
    BOOK_RETURNED: `thanks for putting the book back!`,

    BOOK_BORROWED_NOTIFY_1: `hey! the book you signed up for has just been picked up by someone else from the shelf `,
    BOOK_BORROWED_NOTIFY_2: `we'll let you know when the book is back 🐌`,
    BOOK_RETURNED_NOTIFY_1: `hey! great news! the book you signed up for is back on the shelf`,
    BOOK_RETURNED_NOTIFY_2: `🐌`,

    SUPPORT: `it looks like something's gone wrong. please contact us:: @shellllllf 🤖`,
    NO_BOOK_TO_RETURN: `it looks like you haven't picked up any book yet. if that's not true, please contact us: @shellllllf 🤖`,
    NO_BOOK_TO_UNSUBSCRIBE: `it looks like you haven't subscribed to any book. if that's not true, please contact us: @shellllllf 🤖`,
    DUPLICATED_BOOK: `it looks like you're already reading this book.\n\nif that's not true, please contact us: @shellllllf 🤖`,

    BOOK_NOT_MARKED_AS_RETURNED_1: `it looks like you forgot to notify the bot that you returned the book:\n\n`,
    BOOK_NOT_MARKED_AS_RETURNED_2: `to return the book back, put it back on the shelf `,
    BOOK_NOT_MARKED_AS_RETURNED_3: `, and then hit the "return" button in the bot's menu 🤝`,
    BOOK_NOT_MARKED_AS_RETURNED_4: `if something’s gone wrong, please contact us: @shellllllf 🤖`,

    ADMIN_ERROR: `bot\n\nчто-то пошло не так у пользователя:\n`,

    REMINDER: `hey, please, return the book by `,
    REMINDER_ENDING: `\n\nother readers have been waiting for this book, and you might find something new on our shelves 🐌`,
    HOW_TO_RETURN: `to return the book, put it back on the shell(f)’ shelf and then hit the "return" button in the bot's menu 🤝`,

    REMINDER_OVERDUE_1: `hey! it looks like one book still needs to go back on the shelf. the return period ended on `,
    REMINDER_OVERDUE_2: `. so here's a reminder of the book:`,
    REMINDER_OVERDUE_3: `if you've finished the book, please put it back on the shelf `,
    REMINDER_OVERDUE_4: ` and then hit the "return" button in the bot's menu 🐌\n\n`,
    REMINDER_OVERDUE_5: `if something’s gone wrong, please contact us: @shellllllf 🤖`,

    REPORT_OVERDUE: `в интернете опять кто-то неправ, а в библиотеке опять кто-то проебался:\n\n`,

    DONATE: `support our project:\n[tinkoff](${config.TINKOFF_LINK})\n[paypal](${config.PAYPAL_LINK})`,

    CATALOGUE: `here you can see all the books in the library and which ones are available on the shelves right now\n\nif you want to read the book that's still being read by someone else, you can subscribe to it. we'll let you know when it's back 🐌`,

    // NOTIFICATION: ``,
  },
  ru: {
    BUTTON_OPEN_CATALOGUE: `открыть каталог`,
    BUTTON_CANCEL: `отмена`,
    BUTTON_PROLONG: `продлить на 1 неделю`,
    BUTTON_HOW_TO_RETURN: `как вернуть?`,

    BOOK_LOADER: `записываем... пожалуйста, подожди!`,
    REPEATED_COMMAND: `эту книгу мы уже записали!`,
    BOOK_BORROWED: `привет, записали! не забудь вернуть книгу до `,
    BOOK_BORROWED_ENDING: `\n\nприятного чтения 🐌`,
    BOOK_SUBSCRIBED: `привет! добавили тебя в список ожидания на книгу:`,
    BOOK_SUBSCRIBED_ENDING: `пришлём сообщение, как только книга вернётся на полку `,
    BOOK_UNSUBSCRIBED: `удалили тебя из списка ожидания на книгу:`,
    WRONG_COMMAND: `такой команды не существует 🫣`,
    HELP_COMMAND: `если у тебя iPhone, пожалуйста, закрой чат с ботом перед тем, как отсканировать qr-код на обложке. есть баги, которые нам не поправить🤖\n\nнаписать человеку: @shellllllf 🤖`,
    EMPTY_START_COMMAND: `чтобы взять книгу, отсканируй qr-код с обложки`,
    CHOOSE_BOOK_RETURN: `выбери книгу, которую хочешь вернуть:`,
    CHOOSE_BOOK_UNSUBSCRIBE: `выбери книгу, от которой хочешь отписаться:`,
    BOOK_RETURNED: `спасибо, что вернул:а книгу на полку!`,

    BOOK_BORROWED_NOTIFY_1: `привет! книгу, на которую ты подписан:а, только что забрали с полки `,
    BOOK_BORROWED_NOTIFY_2: `мы обязательно сообщим, как только книга снова станет доступна 🐌`,
    BOOK_RETURNED_NOTIFY_1: `привет! отличные новости! книга, на которую ты подписан:а, снова на полке `,
    BOOK_RETURNED_NOTIFY_2: `🐌`,

    SUPPORT: `кажется, что-то пошло не так. напиши, пожалуйста, в поддержку: @shellllllf 🤖`,
    NO_BOOK_TO_RETURN: `кажется, ты ещё не взял:а ни одной книги. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,
    NO_BOOK_TO_UNSUBSCRIBE: `кажется, у тебя нет ни одной подписки на книгу. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,
    DUPLICATED_BOOK: `кажется, ты уже читаешь эту книгу.\n\nесли это не так или ты пытаешься продлить книгу, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,

    BOOK_NOT_MARKED_AS_RETURNED_1: `кажется, ты забыл:а отметить, что сдал:а книгу:\n\n`,
    BOOK_NOT_MARKED_AS_RETURNED_2: `чтобы вернуть книгу, поставь её на полку `,
    BOOK_NOT_MARKED_AS_RETURNED_3: `, а потом нажми на кнопку «вернуть книгу» в меню этого бота 🤝`,
    BOOK_NOT_MARKED_AS_RETURNED_4: `если что-то пошло не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖`,

    ADMIN_ERROR: `bot\n\nчто-то пошло не так у пользователя:\n`,

    REMINDER: `привет! не забудь вернуть книгу до `,
    REMINDER_ENDING: `\n\nдругие читател:ьницы уже ее заждались, а для тебя на наших полках, возможно, появилось что-то новое интересное 🐌`,
    HOW_TO_RETURN: `чтобы вернуть книгу, поставь её на полку shell(f), а потом нажми на кнопку «вернуть книгу» в меню этого бота 🤝`,

    REMINDER_OVERDUE_1: `привет! похоже, одну книгу всё ещё нужно вернуть на полку. срок возврата истёк `,
    REMINDER_OVERDUE_2: `, поэтому напоминаем о ней:`,
    REMINDER_OVERDUE_3: `если ты дочитал:а книгу, пожалуйста, поставь её на полку `,
    REMINDER_OVERDUE_4: ` и нажми на кнопку «вернуть книгу» в меню этого бота 🐌\n\n`,
    REMINDER_OVERDUE_5: `если у тебя возникли какие-то сложности с возвратом, напиши нам в @shellllllf — всегда готовы помочь!🙏🏻`,

    REPORT_OVERDUE: `в интернете опять кто-то неправ, а в библиотеке опять кто-то проебался:\n\n`,

    DONATE: `поддержать работу библиотеки донейшеном:\n[tinkoff](${config.TINKOFF_LINK})\n[paypal](${config.PAYPAL_LINK})`,

    CATALOGUE: `здесь можно увидеть все книги библиотеки, а также какие из них доступны на полках прямо сейчас\n\nесли нужную тебе книгу ещё кто-то читает, в каталоге есть опция подписки: подписавшись на книгу, ты узнаешь, когда она снова вернётся на полку 🐌`,

    // NOTIFICATION: ``,
  },
};

function getMessage(language, key) {
  return userMessages[language][key] || userMessages[`en`][key];
}

module.exports = {getMessage};