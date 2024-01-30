'use strict';
const telegramUtils = require('../utils/telegramUtils');
const config = require('../constants/config');
const messages = require('../constants/messages');
const googleSheetsUtils = require("../utils/googleSheetsUtils");
const log = require('../utils/customLogger');

function isDeadlineIn(deadline, days) {
  const deadlineDate = parseDate(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysInMilliseconds = days * 24 * 60 * 60 * 1000;
  const timeDiff = deadlineDate.getTime() - today.getTime();

  return timeDiff === threeDaysInMilliseconds;
}

function countDaysOnHands(borrowed) {
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

module.exports.handler = async (event) => {
  const returnDate = await add3DaysAndFormat(Math.floor(Date.now() / 1000));
  log.info('reminder',
    'Return date: %s', returnDate);

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

  try {
    const rows = await googleSheetsUtils.getRows(config.BOOKS_LOG);

    let reminders = [];
    let overdueBooks = [];
    let lostBooks = [];
    if (rows && rows.length > 0) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const borrowed = row[borrowedColumn];
        const deadline = row[deadlineColumn];
        const returned = row[returnedColumn];

        if (!returned) {
          if (isDeadlineIn(deadline, config.REMIND_DAYS)) {
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

          const daysOnHands = countDaysOnHands(borrowed);
          if (daysOnHands > config.LOST_DAYS) {
            lostBooks.push({
              chatID: row[chatIDColumn],
              username: row[usernameColumn],
              bookID: row[bookIDColumn],
              title: row[titleColumn],
              author: row[authorColumn],
              shelf: row[shelfColumn],
              lostDays: daysOnHands - config.LOST_DAYS,
              // deadline: deadline,
              // prolonged: row[prolongedColumn],
              // rowNumber: i + 1,
            })
          } else if (daysOnHands > config.OVERDUE_DAYS) {
            overdueBooks.push({
              chatID: row[chatIDColumn],
              username: row[usernameColumn],
              bookID: row[bookIDColumn],
              title: row[titleColumn],
              author: row[authorColumn],
              shelf: row[shelfColumn],
              overdueDays: daysOnHands - config.OVERDUE_DAYS,
              // deadline: deadline,
              // prolonged: row[prolongedColumn],
              // rowNumber: i + 1,
            })
          }
        }
      }
    }

    // Logic to send reminder messages
    for (const reminder of reminders) {
      const bookInfo = reminder.author ?
        `${reminder.title}, ${reminder.author}` : reminder.title;

      log.info('reminder',
        'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, Username: %s, ChatID: %s',
        messages.SENDING_REMINDER, reminder.bookID, bookInfo, reminder.shelf,
        reminder.username, reminder.chatID);

      await telegramUtils.remindToReturn(reminder.chatID, reminder);
    }

    // Logic to track overdue books
    for (const overdueBook of overdueBooks) {
      const bookInfo = overdueBook.author ?
        `${overdueBook.title}, ${overdueBook.author}` : overdueBook.title;

      log.info('reminder',
        'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, OverdueDays: %s, Username: %s, ChatID: %s',
        messages.SENDING_OVERDUE, overdueBook.bookID, bookInfo,
        overdueBook.shelf, overdueBook.overdueDays, overdueBook.username,
        overdueBook.chatID);

      if (overdueBook.overdueDays === 1 || overdueBook.overdueDays % 7 === 0) {
        // Logic to send overdue notification
        console.log(
          `${overdueBook.username} (${overdueBook.chatID}) is overdue for book ${overdueBook.bookID} for ${overdueBook.overdueDays} days`);
        // await telegramUtils.remindOverdue(overdueBook.chatID, overdueBook);
      }
    }

    // Logic to track lost books
    for (const lostBook of lostBooks) {
      const bookInfo = lostBook.author ?
        `${lostBook.title}, ${lostBook.author}` : lostBook.title;

      log.info('reminder',
        'Status: "%s", BookID: %s, BookInfo: %s, Shelf: %s, LostDays: %s, Username: %s, ChatID: %s',
        messages.SENDING_LOST, lostBook.bookID, bookInfo, lostBook.shelf,
        lostBook.lostDays, lostBook.username, lostBook.chatID);

      if (lostBook.lostDays === 1 || lostBook.lostDays % 7 === 0) {
        // Logic to send overdue notification
        console.log(
          `${lostBook.username} (${lostBook.chatID}) lost book ${lostBook.bookID} for ${lostBook.lostDays} days`);
        // await telegramUtils.remindLost(overdueBook.chatID, lostBook);
      }
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
