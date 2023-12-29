const devConfig = {
  REGION: 'eu-central-1',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  SHEETS_ID: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
  ADMIN_CHAT_ID: 124760667,
  BOOKS_DB: 'booksDB',
  BOOKS_LOG: 'booksLog',
  ID_COLUMN: 0,
  TITLE_COLUMN: 1,
  AUTHOR_COLUMN: 2,

  DATE_COLUMN: 0,
  DEADLINE_COLUMN: 1,
  USERNAME_COLUMN: 2,
  CHATID_COLUMN: 3,
  BOOKID_COLUMN: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  SHELF_COLUMN_LOG: 7,
  PROLONG_COLUMN: 8,
  RETURN_COLUMN: 9,
  COLUMNS_NUMBER: 10,

  REMIND_DAYS: 3,
  OVERDUE_DAYS: 40,
  LOST_DAYS: 60,

  TINKOFF_LINK: 'https://www.tinkoff.ru/collectmoney/crowd/anderson.layma1/latFj82826/?short_link=165fWSttnKA&httpMethod=GET',
  PAYPAL_LINK: 'paypal.me/shelllf',
};

const prodConfig = {
  REGION: 'eu-central-1',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  SHEETS_ID: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
  ADMIN_CHAT_ID: 124760667,
  BOOKS_DB: 'список книг',
  BOOKS_LOG: 'бот в телеге',
  ID_COLUMN: 1,
  TITLE_COLUMN: 2,
  AUTHOR_COLUMN: 3,

  DATE_COLUMN: 0,
  DEADLINE_COLUMN: 1,
  USERNAME_COLUMN: 2,
  CHATID_COLUMN: 3,
  BOOKID_COLUMN: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  SHELF_COLUMN_LOG: 7,
  PROLONG_COLUMN: 8,
  RETURN_COLUMN: 9,
  COLUMNS_NUMBER: 10,

  REMIND_DAYS: 3,
  OVERDUE_DAYS: 40,
  LOST_DAYS: 60,

  TINKOFF_LINK: '[tinkoff](https://www.tinkoff.ru/collectmoney/crowd/anderson.layma1/latFj82826/?short_link=165fWSttnKA&httpMethod=GET)',
  PAYPAL_LINK: '[paypal](https://www.paypal.com/paypalme/shelllf)',
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

module.exports = config;

