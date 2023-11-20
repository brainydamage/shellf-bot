interface Config {
  REGION: string;
  ANY: string;
  CLIENT_EMAIL: string;
  CLIENT_PRIVATE_KEY: string;
  SCOPE: string;
  SHEETS_ID: string;
  BOOKS_DB: string;
  BOOKS_LOG: string;
  ID_COLUMN: number;
  TITLE_COLUMN: number;
  AUTHOR_COLUMN: number;
  DEADLINE_COLUMN: number;
  USERNAME_COLUMN: number;
  CHATID_COLUMN: number;
  BOOKID_COLUMN: number;
  TITLE_COLUMN_LOG: number;
  AUTHOR_COLUMN_LOG: number;
  RETURN_COLUMN: number;
}

const baseConfig = {
  //aws settings
  REGION: 'eu-central-1',
  ANY: 'any',

  //google api settings
  CLIENT_EMAIL: 'shellf_client_email',
  CLIENT_PRIVATE_KEY: 'shellf_private_key',
  SCOPE: 'https://www.googleapis.com/auth/spreadsheets',

  //BOOKS_LOG sheet layout
  DEADLINE_COLUMN: 1,
  USERNAME_COLUMN: 2,
  CHATID_COLUMN: 3,
  BOOKID_COLUMN: 4,
  TITLE_COLUMN_LOG: 5,
  AUTHOR_COLUMN_LOG: 6,
  RETURN_COLUMN: 7,
};

const devConfig: Config = {
  ...baseConfig,

  //google sheets names
  SHEETS_ID: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
  BOOKS_DB: 'booksDB',
  BOOKS_LOG: 'booksLog',

  //booksDB sheet layout
  ID_COLUMN: 0,
  TITLE_COLUMN: 1,
  AUTHOR_COLUMN: 2,
};


const prodConfig: Config = {
  ...baseConfig,

  //google sheets names
  SHEETS_ID: '1_M9hvCTY1MAbxKIa2ANeUYQpnx2W8IPwleSaR4hazYs',
  BOOKS_DB: 'список книг test',
  BOOKS_LOG: 'бот в телеге',

  //BOOKS_DB sheet layout
  ID_COLUMN: 1,
  TITLE_COLUMN: 2,
  AUTHOR_COLUMN: 3,
};

const config: Config = process.env.NODE_ENV === 'production' ? prodConfig :
  devConfig;

export default config;
