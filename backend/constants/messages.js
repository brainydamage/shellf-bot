module.exports = {
  //Success
  BOOK_REQUESTED: 'Book requested',
  BOOK_LIST_REQUESTED: 'All books requested',
  BOOK_FOUND: 'Book found',
  BOOK_LIST_RECEIVED: 'Book list received',
  BOOK_BORROWED: 'Book borrowed',
  BOOK_RETURNED: 'Book returned',
  BOOK_PROLONGED: 'Book prolonged',
  BOOK_SUBSCRIBED: 'Book subscribed',
  BOOK_UNSUBSCRIBED: 'Book unsubscribed',
  BOOK_UNSUBSCRIBED_HIDDEN: 'Book unsubscribed while borrowing',

  //Fail
  FAILED_SCAN_BOOK: 'Failed to scan book',
  FAILED_GET_BOOKS_LIST: 'Failed to get books list',
  FAILED_BORROW_BOOK: 'Failed to borrow book',
  FAILED_APPEND_ROW: 'Failed to append a row while borrowing',
  FAILED_GET_BOOK_DATA: 'Failed to get book data while borrowing',
  FAILED_RETURN_BOOK: 'Failed to return book',
  FAILED_PROLONG_BOOK: 'Failed to prolong book',
  FAILED_SUBSCRIBE_BOOK: 'Failed to subscribe on the book',
  FAILED_UNSUBSCRIBE_BOOK: 'Failed to unsubscribe from the book',

  WARN_DOUBLE_REQUEST: 'User requests the same book: double click situation',
  // WARN_PROLONG_BOOK: 'Row with book to PROLONG is not found, probably
  // "double click" situation', WARN_RETURN_BOOK: 'Row with book to RETURN is
  // not found, probably "double click" situation',

  //BookID errors
  INVALID_BOOK_ID_FORMAT: 'Invalid bookID format',
  INVALID_PAYLOAD: 'Invalid or strange payload',
  NOT_VALID_BOOK_ID: 'Not valid book id',
  BOOK_NOT_FOUND: 'Book not found',
  BOOK_LIST_EMPTY: 'No book found',

  //TG
  FAILED_SEND_TG: 'Failed to send telegram message to user',
  FAILED_SEND_TG_ADMIN: 'Failed to send telegram message to admin',
  FAILED_SEND_TG_KEYBOARD: 'Failed to send telegram message: list of books',
  FAILED_SEND_TG_REMINDER: 'Failed to send telegram message: reminder',
  FAILED_SEND_TG_OVERDUE_LOST: 'Failed to send telegram message: overdue or lost',

  //Google Sheets
  FAILED_GET_SSM: 'Failed to get parameters from SSM',
  FAILED_GET_GOOGLE_SHEETS: 'Failed to get Google Sheets object',
  FAILED_READ_DB: 'Failed to read Google Sheets',
  FAILED_UPDATE_DB: 'Failed to update Google Sheets',
  FAILED_UPDATE_ROW_DB: 'Failed to update row in Google Sheets',

  //Reminder
  SENDING_REMINDER: 'Sending reminder',
  SENDING_OVERDUE: 'Sending reminder: overdue',
  SENDING_LOST: 'Sending reminder: lost',
  SENDING_NOTIFICATION: 'Sending notification',
  TRACKING_OVERDUE: 'Tracking overdue book',
  TRACKING_LOST: 'Tracking lost book',
  FAILED_REMINDER: 'Failed to handle reminder',
  FAILED_NOTIFIER: 'Failed to handle notifier',
};
