const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

AWS.config.update({
  region: 'eu-central-1'
});

const logGroupNameBot = '/aws/lambda/shellf-bot-dev-bot_handler';
const logGroupNameBackend = '/aws/lambda/shellf-bot-dev-backend_handler';
const logStreamName = '2023/12/21/[$LATEST]imported';
const csvFilePath = path.join(__dirname, 'oldLog.csv'); // Path to your CSV file

const cloudwatchlogs = new AWS.CloudWatchLogs();

function parseDateToTimestamp(dateStr) {
  const [day, month, year] = dateStr.split('.');
  // Create a UTC date string by appending 'T00:00:00Z' which denotes midnight
  // in UTC
  const dateInUTC = `${year}-${month.padStart(2, '0')}-${day.padStart(2,
    '0')}T00:00:00Z`;
  // Date.parse returns the number of milliseconds since January 1, 1970,
  // 00:00:00 UTC
  return Date.parse(dateInUTC);
}

function convertTimestampToISO8601(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString();
}

function createLogEventBorrowed(row) {
  const timestamp = parseDateToTimestamp('21.12.2023');
  const timestampBorrowed = parseDateToTimestamp(row.borrowed);
  const logDate = convertTimestampToISO8601(timestampBorrowed);

  const bookInfo = row.author ? `${row.title}, ${row.author}` : row.title;

  const message = `info base-command-handler ${logDate} - Success: "Book borrowed", Command: /start, BookID: ${row.bookID}, BookInfo: ${bookInfo}, Shelf: ${row.shelf}, Username: ${row.username}, ChatID: 000`;
  return {timestamp, message};
}

function createLogEventReturned(row) {
  if (row.returned) {
    const timestamp = parseDateToTimestamp('21.12.2023');
    const timestampBorrowed = parseDateToTimestamp(row.borrowed);
    const timestampReturned = parseDateToTimestamp(row.returned);
    const logDate = convertTimestampToISO8601(timestampReturned);

    const bookInfo = row.author ? `${row.title}, ${row.author}` : row.title;

    const timeDiff = timestampReturned - timestampBorrowed;
    const daysBorrowed = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const message = `info callback-command-handler ${logDate} - Success: "Book returned", Callback: _return, BookID: ${row.bookID}, BookInfo: ${bookInfo}, DaysBorrowed: ${daysBorrowed}, Username: ${row.username}, ChatID: 000, Shelf: ${row.shelf}`;
    return {timestamp, message};
  }
}

function createLogEventFound(row) {
  const timestamp = parseDateToTimestamp(row.date);
  const logDate = convertTimestampToISO8601(timestamp);

  const bookInfo = row.author ? `${row.title}, ${row.author}` : row.title;

  //info backend 2023-12-28T15:12:57.013Z - Success: "Book found", BookID: 141,
  // BookInfo: title, author
  const message = `info backend ${logDate} - Success: "Book found", BookID: ${row.bookID}, BookInfo: ${bookInfo}`;
  return {timestamp, message};
}

function listLogStreams(logGroupName) {
  const params = {
    logGroupName: logGroupName, // You can specify additional parameters here
                                // if needed
  };

  cloudwatchlogs.describeLogStreams(params, function (err, data) {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Log Streams:', data.logStreams);
    }
  });
}

function listLogGroups() {
  const params = {
    // You can add parameters like 'limit' or 'logGroupNamePrefix' if needed
  };

  cloudwatchlogs.describeLogGroups(params, function (err, data) {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Log Groups:', data.logGroups);
    }
  });
}

function uploadLogEvents(logEvents, logGroupName) {
  const params = {
    logEvents, logGroupName, logStreamName,
  };

  console.log(params);

  cloudwatchlogs.putLogEvents(params, (err, data) => {
    if (err) console.log(err, err.stack); else console.log(data);
  });
}

const logEventsBotBorrowed = [];
const logEventsBotReturned = [];
// const logEventsBackend = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // console.log(row);
    // logEventsBackend.push(createLogEventFound(row));
    // logEventsBotBorrowed.push(createLogEventBorrowed(row));
    logEventsBotReturned.push(createLogEventReturned(row));
  })
  .on('end', () => {
    // console.log('CSV file successfully processed');
    // console.log(logEventsBot);
    // uploadLogEvents(logEventsBackend, logGroupNameBackend);
    // uploadLogEvents(logEventsBotBorrowed, logGroupNameBot);
    uploadLogEvents(logEventsBotReturned, logGroupNameBot);
  });

// listLogGroups();
// listLogStreams(logGroupName);