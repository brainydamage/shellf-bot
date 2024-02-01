'use strict';
const telegramUtils = require('../utils/telegramUtils');
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

function isDeadlineIn(deadline, days) {
  const deadlineDate = parseDate(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysInMilliseconds = days * 24 * 60 * 60 * 1000;
  const timeDiff = deadlineDate.getTime() - today.getTime();

  return timeDiff === threeDaysInMilliseconds;
}

async function countDaysOnHands(borrowed) {
  const borrowedDate = parseDate(borrowed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeDiff = today.getTime() - borrowedDate.getTime();

  return timeDiff / 24 / 60 / 60 / 1000;
}

function parseDate(dateString) {
  //19.12.2023, 18:47
  //19.01.2024
  const dateParts = dateString.split(', ');
  const [day, month, year] = dateParts[0].split('.').map(Number);

  return new Date(year, month - 1, day);
}

async function add3DaysAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  date.setDate(date.getDate() + 3); // Add 3 days

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear(); // Get year

  return `${day}.${month}.${year}`;
}

async function processReminders(rows) {
  let reminders = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const deadline = row[deadlineColumn];
    const returned = row[returnedColumn];

    if (!returned && isDeadlineIn(deadline, config.REMIND_DAYS)) {
      reminders.push({
        chatID: row[chatIDColumn],
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
    const borrowed = row[borrowedColumn];
    const deadline = row[deadlineColumn];
    const returned = row[returnedColumn];
    const daysOnHands = await countDaysOnHands(borrowed);

    if (!returned && daysOnHands > config.OVERDUE_DAYS) {
      overdueBooks.push({
        chatID: row[chatIDColumn],
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
  const returnDate = await add3DaysAndFormat(Math.floor(Date.now() / 1000));
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