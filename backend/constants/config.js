// module.exports = {
// REGION: 'eu-central-1',
// ANY: 'any',
// CLIENT_EMAIL: 'shellf_client_email',
// CLIENT_PRIVATE_KEY: 'shellf_private_key',
// SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
// CALENDAR_ID_DEV: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
// CALENDAR_ID_PROD: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
// BOOKS_DB_DEV: 'booksDB',
// BOOKS_DB_PROD: 'список книг test',
// ID_COLUMN_DEV: 0,
// TITLE_COLUMN_DEV: 1,
// AUTHOR_COLUMN_DEV: 2,
// ID_COLUMN_PROD: 2,
// TITLE_COLUMN_PROD: 2,
// AUTHOR_COLUMN_PROD: 3,
// };

const devConfig = {
  REGION: 'eu-central-1',
  ANY: 'any',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  CALENDAR_ID: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
  BOOKS_DB: 'booksDB',
  BOOKS_LOG: 'booksLog',
  ID_COLUMN: 0,
  TITLE_COLUMN: 1,
  AUTHOR_COLUMN: 2,
};

const prodConfig = {
  REGION: 'eu-central-1',
  ANY: 'any',
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
  CALENDAR_ID: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
  BOOKS_DB: 'список книг test',
  BOOKS_LOG: 'бот в телеге',
  ID_COLUMN: 1,
  TITLE_COLUMN: 2,
  AUTHOR_COLUMN: 3,
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

module.exports = config;

