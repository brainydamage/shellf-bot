const config = require("./config");
module.exports = {
  BOOK_LOADER: 'записываем... пожалуйста, подожди!',
  REPEATED_COMMAND: 'эту книгу мы уже записали!',
  BOOK_BORROWED: 'привет, записали! не забудь вернуть книгу до ',
  BOOK_BORROWED_ENDING: '\n\nприятного чтения 🐌',
  BOOK_SUBSCRIBED: 'привет! добавили тебя в список ожидания на книгу:',
  BOOK_SUBSCRIBED_ENDING: 'пришлём сообщение, как только книга вернётся на полку ',
  BOOK_UNSUBSCRIBED: 'удалили тебя их списка ожидания на книгу:',
  WRONG_COMMAND: 'такой команды не существует',
  HELP_COMMAND: 'если у тебя iPhone, пожалуйста, закрой чат с ботом перед тем, как отсканировать qr-код на обложке. есть баги, которые нам не поправить🤖\n\nнаписать человеку: @shellllllf 🤖',
  EMPTY_START_COMMAND: 'привет! чтобы взять книгу, отсканируй qr-код с обложки',
  CHOOSE_BOOK_RETURN: 'выбери книгу, которую хочешь вернуть:',
  CHOOSE_BOOK_UNSUBSCRIBE: 'выбери книгу, от которой хочешь отписаться:',
  BOOK_RETURNED: 'спасибо, что вернул:а книгу на полку!',

  BOOK_BORROWED_NOTIFY_1: 'привет! книгу, на которую ты подписан:а, только что забрали с полки ',
  BOOK_BORROWED_NOTIFY_2: 'мы обязательно сообщим, как только книга вновь станет доступна 🐌',
  BOOK_RETURNED_NOTIFY_1: 'привет! отличные новости! книга, на которую ты подписан:а, снова на полке ',
  BOOK_RETURNED_NOTIFY_2: '🐌',

  SUPPORT: 'кажется, что-то пошло не так. напиши, пожалуйста, в поддержку: @shellllllf 🤖',
  NO_BOOK_TO_RETURN: 'кажется, ты ещё не взял:а ни одной книги. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖',
  NO_BOOK_TO_UNSUBSCRIBE: 'кажется, у тебя нет ни одной подписки на книгу. если это не так, напиши, пожалуйста, в поддержку: @shellllllf 🤖',

  ADMIN_ERROR: 'bot\n\nчто-то пошло не так у пользователя:\n',

  REMINDER: 'привет! не забудь вернуть книгу до ',
  REMINDER_ENDING: '\n\nдругие читател:ьницы уже ее заждались, а для тебя на наших полках, возможно, появилось что-то новое интересное 🐌',
  HOW_TO_RETURN: 'поставь книгу на полку shell(f), а потом нажми кнопку «вернуть книгу» из меню 🤝',
  REMINDER_OVERDUE_1: 'привет! похоже, одну книгу всё ещё нужно вернуть на полку. срок возврата истёк ',
  REMINDER_OVERDUE_2: ', поэтому напоминаем о ней:',
  REMINDER_OVERDUE_3: 'если ты дочитал:а книгу, пожалуйста, поставь её на полку ',
  REMINDER_OVERDUE_4: ' и нажми на кнопку «вернуть книгу» в меню этого бота 🐌\n\nесли у тебя возникли какие-то сложности с возвратом, напиши нам в @shellllllf — всегда готовы помочь!🙏🏻',

  CATALOGUE: `здесь можно увидеть все книги библиотеки, а также какие из них доступны на полках Nekrasova и Flat прямо сейчас
если нужную тебе книгу ещё кто-то читает, в каталоге есть опция подписки: подписавшись на книгу, ты узнаешь, когда она снова вернётся на полку

[каталог книг](${config.CATALOGUE_LINK})

🐌`,
  DONATE: `поддержать работу библиотеки донейшеном:\n[tinkoff](${config.TINKOFF_LINK})\n[paypal](${config.PAYPAL_LINK})`,

  NOTIFICATION: `привет! в нашем боте появилась новая кнопка!
/catalogue - смотреть каталог/подписаться на книгу
  
нажав на неё, можно увидеть все книги библиотеки, а также какие из них доступны на полках Nekrasova и Flat прямо сейчас

если нужную тебе книгу ещё кто-то читает, в каталоге есть опция подписки: подписавшись на книгу, ты узнаешь, когда она снова вернётся на полку

пожалуйста, не забывай отмечаться в боте, когда берёшь и возвращаешь книгу, чтобы информация в каталоге была актуальной 🙏`
};
