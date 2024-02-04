function timestampToHumanReadable(timestamp) {
  const date = new Date(timestamp * 1000);

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Belgrade'
  };

  return date.toLocaleString('ru-RU', options);
}

function addOneMonthAndFormat(timestamp) {
  const date = new Date(timestamp * 1000);

  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + 1); // Add one month

  // Check for month rollover (e.g., Jan 31 to Feb 28/29)
  if (date.getDate() !== originalDay) {
    date.setDate(0); // Set to the last day of the previous month
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth()
                                                                   // is
                                                                   // 0-indexed
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function getLaterDate(date1Timestamp, date2String) {
  const timezoneOffset = 3600 * 1000; // 1 hour offset for GMT+1
  const date1Date = new Date((date1Timestamp * 1000) + timezoneOffset);

  const [day, month, year] = date2String.split('.').map(Number);
  const date2Date = new Date(year, month - 1, day);

  // Compare and return the later date in date1Timestamp format
  if (date2Date > date1Date) {
    return Math.floor(date2Date.getTime() / 1000);
  } else {
    return date1Timestamp;
  }
}

function addNDaysAndFormat(timestamp, days) {
  const date = new Date(timestamp * 1000);

  date.setDate(date.getDate() + days);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function parseDate(dateString) {
  //19.12.2023, 18:47
  //19.01.2024
  const dateParts = dateString.split(', ');
  const [day, month, year] = dateParts[0].split('.').map(Number);

  return new Date(year, month - 1, day);
}

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

module.exports = {
  timestampToHumanReadable,
  addOneMonthAndFormat,
  getLaterDate,
  addNDaysAndFormat,
  isDeadlineIn,
  countDaysOnHands
};