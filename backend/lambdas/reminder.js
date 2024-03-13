'use strict';
const telegramUtils = require('../utils/telegramUtils');
const dateTimeUtils = require('../utils/dateTimeUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require("../utils/googleSheetsUtils");
const log = require('../utils/customLogger');

const borrowedColumn = config.DATE_COLUMN_LOG;
const deadlineColumn = config.DEADLINE_COLUMN_LOG;
const returnedColumn = config.RETURN_COLUMN_LOG;
const prolongedColumn = config.PROLONG_COLUMN_LOG;
const bookIDColumn = config.BOOKID_COLUMN_LOG;
const titleColumn = config.TITLE_COLUMN_LOG;
const authorColumn = config.AUTHOR_COLUMN_LOG;
const shelfColumn = config.SHELF_COLUMN_LOG;
const chatIDColumn = config.CHATID_COLUMN_LOG;
const usernameColumn = config.USERNAME_COLUMN_LOG;

async function processReminders(rows) {
  let reminders = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const chatID = row[chatIDColumn];
    const deadline = row[deadlineColumn];
    const returned = row[returnedColumn];

    if (parseInt(chatID, 10) && !returned &&
      dateTimeUtils.isDeadlineIn(deadline, config.REMIND_DAYS)) {
      reminders.push({
        chatID: chatID,
        username: row[usernameColumn],
        bookID: row[bookIDColumn],
        title: row[titleColumn],
        author: row[authorColumn],
        shelf: row[shelfColumn],
        deadline: deadline,
        prolonged: row[prolongedColumn],
        rowNumber: i + 1,
      });
    }
  }

  for (const reminder of reminders) {
    const bookInfo = constructBookInfo(reminder);
    logReminderInfo(reminder, bookInfo);
    await telegramUtils.remindToReturn(reminder.chatID, reminder);
  }
}

async function processOverdueBooks(rows) {
  let overdueBooks = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const chatID = row[chatIDColumn];
    const borrowed = row[borrowedColumn];
    const deadline = row[deadlineColumn];
    const returned = row[returnedColumn];
    const daysOnHands = dateTimeUtils.countDaysOnHands(borrowed);

    if (parseInt(chatID, 10) && !returned && daysOnHands >
      config.OVERDUE_DAYS) {
      overdueBooks.push({
        chatID: chatID,
        username: row[usernameColumn],
        bookID: row[bookIDColumn],
        title: row[titleColumn],
        author: row[authorColumn],
        shelf: row[shelfColumn],
        deadline: deadline,
        overdueDays: daysOnHands - config.OVERDUE_DAYS,
      })
    }
  }

  for (const overdueBook of overdueBooks) {
    const bookInfo = constructBookInfo(overdueBook);
    logOverdueBookInfo(overdueBook, bookInfo);

    if (overdueBook.overdueDays === 1 || overdueBook.overdueDays % 7 === 0) {
      logOverdueBookReminder(overdueBook, bookInfo);
      await telegramUtils.remindOverdue(overdueBook.chatID, overdueBook);
    }

    if (overdueBook.overdueDays % 30 === 0) {
      // logOverdueBookReminder(overdueBook, bookInfo);
      await telegramUtils.reportOverdue(overdueBook);
    }
  }
}

function constructBookInfo(book) {
  return book.author ? `${book.title}, ${book.author}` : book.title;
}

function logReminderInfo(reminder, bookInfo) {
  log.info('reminder',
    'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
    messages.SENDING_REMINDER, reminder.bookID, bookInfo, reminder.shelf,
    reminder.username, reminder.chatID);
}

function logOverdueBookInfo(overdueBook, bookInfo) {
  if (overdueBook.overdueDays < 20) {
    log.info('reminder',
      'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, OverdueDays: %s, Username: %s, ChatID: %s',
      messages.TRACKING_OVERDUE, overdueBook.bookID, bookInfo,
      overdueBook.shelf, overdueBook.overdueDays, overdueBook.username,
      overdueBook.chatID);
  } else {
    log.info('reminder',
      'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, LostDays: %s, Username: %s, ChatID: %s',
      messages.TRACKING_LOST, overdueBook.bookID, bookInfo, overdueBook.shelf,
      overdueBook.overdueDays, overdueBook.username, overdueBook.chatID);
  }
}

function logOverdueBookReminder(overdueBook, bookInfo) {
  if (overdueBook.overdueDays < 20) {
    log.info('reminder',
      'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, OverdueDays: %s, Username: %s, ChatID: %s',
      messages.SENDING_OVERDUE, overdueBook.bookID, bookInfo, overdueBook.shelf,
      overdueBook.overdueDays, overdueBook.username, overdueBook.chatID);
  } else {
    log.info('reminder',
      'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, LostDays: %s, Username: %s, ChatID: %s',
      messages.SENDING_LOST, overdueBook.bookID, bookInfo, overdueBook.shelf,
      overdueBook.overdueDays, overdueBook.username, overdueBook.chatID);
  }
}

module.exports.handler = async (event) => {
  const returnDate = dateTimeUtils.addNDaysAndFormat(
    Math.floor(Date.now() / 1000), 3);
  log.info('reminder', 'Return date: %s', returnDate);

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    if (rows && rows.length > 1) {
      await processReminders(rows);
      await processOverdueBooks(rows);
    }
  } catch (error) {
    log.error('reminder', `Reason: "%s", ErrorMessage: %s`,
      messages.FAILED_REMINDER, error.message);

    console.error(error);
  }

  return {
    statusCode: 200, body: JSON.stringify({
      input: event,
    }, null, 2),
  };
};