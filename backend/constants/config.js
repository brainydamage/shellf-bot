const prodConfig = {
  REGION: 'eu-central-1',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  SHEETS_ID: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
  ADMIN_CHAT_ID: 124760667,
  BOOKS_DB: 'список книг',
  BOOKS_LOG: 'бот в телеге',
  BOOKID_COLUMN_DB: 1,
  TITLE_COLUMN_DB: 2,
  AUTHOR_COLUMN_DB: 3,

  DATE_COLUMN_LOG: 0,
  DEADLINE_COLUMN_LOG: 1,
  USERNAME_COLUMN_LOG: 2,
  CHATID_COLUMN_LOG: 3,
  BOOKID_COLUMN_LOG: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  SHELF_COLUMN_LOG: 7,
  PROLONG_COLUMN_LOG: 8,
  RETURN_COLUMN_LOG: 9,
  SEQ_NUM_COLUMN_LOG: 10,
  LOG_COLUMNS_NUMBER: 11,

  REMIND_DAYS: 3,
  OVERDUE_DAYS: 40,
  LOST_DAYS: 60,

  TINKOFF_LINK: '[tinkoff](https://www.tinkoff.ru/collectmoney/crowd/anderson.layma1/latFj82826/?short_link=165fWSttnKA&httpMethod=GET)',
  PAYPAL_LINK: '[paypal](https://www.paypal.com/paypalme/shelllf)',
};

module.exports = prodConfig;

