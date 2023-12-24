module.exports = {
  //triggers
  BACKEND_HANDLER_TRIGGER: 'backend handler triggered',
  BOT_HANDLER_TRIGGER: 'bot handler triggered',
  REMINDER_HANDLER_TRIGGER: 'reminder handler triggered',

  BOOK_REQUESTED: 'requested book ID ',
  BOOK_FOUND: 'requested book: ',
  BOOK_BORROW: ' borrowing book ID: ',
  BOOK_RETURN: ' returning some book',
  BOOK_RETURN_ID: ' returning book ID: ',
  NO_BOOK_RETURN: 'user has no book to return',
  BOOK_PROLONG: ' prolonging book: ',
  WRONG_COMMAND: ' calling wrong command: ',
  HELP_COMMAND: ' calling /HELP command',
  SUPPORT_COMMAND: ' calling /SUPPORT command',
  EMPTY_START: ' calling /START command without bookID',
  CANCELED: ' cancelled returning a book',
  HOW_TO_RETURN: ' asks how to return',

  INVALID_BOOK_ID_FORMAT: 'Invalid bookID format: ',
  INVALID_BOOK_ID_DATABASE: 'Invalid bookID in the database: ',
  INVALID_BOOK_ID_BODY: 'Invalid bookID in the event body',
  INVALID_PAYLOAD: 'Invalid or strange payload',
  NOT_VALID_BOOK_ID: 'Not valid book id',
  INVALID_ROW_NUMBER: 'Could not extract row number from updated range',

  NO_BOOKS_AVAILABLE: 'No books available',
  WRONG_PLACE: 'book is on the wrong place, searching...',
  EMPTY_TITLE_LOG: 'book title is empty, searching in books db...',
  BOOK_NOT_FOUND: 'Book not found',

  FAILED_BORROW_BOOK: 'Failed to borrow book',
  FAILED_GET_BOOK_DATA: 'Failed to get book data while borrowing',
  FAILED_RETURN_BOOK: 'Failed to return book',
  FAILED_PROLONG_BOOK: 'Failed to prolong book',
  WARN_PROLONG_BOOK: 'Row with book to PROLONG is not found, probably "double click" situation',
  WARN_RETURN_BOOK: 'Row with book to RETURN is not found, probably "double click" situation',

  //TG
  FAILED_SEND_TG: 'Failed to send telegram message to user',
  FAILED_SEND_TG_ADMIN: 'Failed to send telegram message to admin',
  FAILED_SEND_TG_KEYBOARD: 'Failed to send telegram message: list of books',
  FAILED_SEND_TG_PROLONG: 'Failed to send telegram message: prolong book',
  FAILED_SEND_ERROR_TG: 'Nested error sending error(!) message via Telegram:',
  DELETING_MSG_TG: 'deleting message with ID ',
  NO_CHAT_TG: 'No chat with ID ',
  NO_MESSAGE_TG: 'No message with ID ',

  //Google Sheets
  FAILED_GET_SSM: 'Failed to get parameters from SSM',
  FAILED_GET_GOOGLE_SHEETS: 'Failed to get Google Sheets object',
  FAILED_READ_DB: 'Failed to read Google Sheets',
  FAILED_UPDATE_DB: 'Failed to update Google Sheets',
  FAILED_UPDATE_ROW_DB: 'Failed to update row in Google Sheets',

  //Reminder
  SENDING_REMINDER: 'sending reminder to '
};
