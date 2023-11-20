const devConfig = {
  REGION: 'eu-central-1',
  ANY: 'any',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  SHEETS_ID: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
  BOOKS_DB: 'booksDB',
  BOOKS_LOG: 'booksLog',
  ID_COLUMN: 0,
  TITLE_COLUMN: 1,
  AUTHOR_COLUMN: 2,

  DEADLINE_COLUMN: 1,
  USERNAME_COLUMN: 2,
  CHATID_COLUMN: 3,
  BOOKID_COLUMN: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  RETURN_COLUMN: 7,
};

const prodConfig = {
  REGION: 'eu-central-1',
  ANY: 'any',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  SHEETS_ID: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
  BOOKS_DB: 'список книг test',
  BOOKS_LOG: 'бот в телеге',
  ID_COLUMN: 1,
  TITLE_COLUMN: 2,
  AUTHOR_COLUMN: 3,

  DEADLINE_COLUMN: 1,
  USERNAME_COLUMN: 2,
  CHATID_COLUMN: 3,
  BOOKID_COLUMN: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  RETURN_COLUMN: 7,
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

module.exports = config;

