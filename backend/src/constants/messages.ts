interface Messages {
  BACKEND_HANDLER_TRIGGER: string,
  BOT_HANDLER_TRIGGER: string,
  REMINDER_HANDLER_TRIGGER: string,
  INVALID_BOOK_ID_FORMAT: string,
  INVALID_BOOK_ID_DATABASE: string,
  NOT_VALID_BOOK_ID: string,
  NO_BOOKS_AVAILABLE: string,
  WRONG_PLACE: string,
  FAILED_ACCESS_DB: string,
  ERROR_ACCESS_DB: string,
  BOOK_NOT_FOUND: string,
}

const messages: Messages = {
  BACKEND_HANDLER_TRIGGER: 'backend handler triggered',
  BOT_HANDLER_TRIGGER: 'bot handler triggered',
  REMINDER_HANDLER_TRIGGER: 'reminder handler triggered',
  INVALID_BOOK_ID_FORMAT: 'Invalid bookID format: ',
  INVALID_BOOK_ID_DATABASE: 'Invalid bookID in the database: ',
  NOT_VALID_BOOK_ID: 'Not valid book id',
  NO_BOOKS_AVAILABLE: 'No books available',
  WRONG_PLACE: ' book is on the wrong place, searching...',
  FAILED_ACCESS_DB: 'failed to access database',
  ERROR_ACCESS_DB: 'Error accessing database',
  BOOK_NOT_FOUND: 'Book not found',
};

export default messages;