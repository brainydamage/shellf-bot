const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

AWS.config.update({
  region: 'eu-central-1'
});

const logGroupNameBot = '/aws/lambda/shellf-bot-dev-bot_handler';
const logGroupNameBackend = '/aws/lambda/shellf-bot-dev-backend_handler';
const logStreamName = '2023/12/19/[$LATEST]imported';
const csvFilePath = path.join(__dirname, 'botLog.csv'); // Path to your CSV file

const cloudwatchlogs = new AWS.CloudWatchLogs();

function parseDateToTimestamp(dateStr) {
  const [date, time] = dateStr.split(', ');
  const [day, month, year] = date.split('.');
  const [hours, minutes] = time.split(':');
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

function convertTimestampToISO8601(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString();
}

function createLogEventBorrowed(row) {
  const timestamp = parseDateToTimestamp(row.date);
  const logDate = convertTimestampToISO8601(timestamp);

  const bookInfo = row.author ? `${row.title}, ${row.author}` : row.title;

  //info base-command-handler 2023-12-27T18:13:27.689Z - Success: "Book
  // borrowed", Command: /start, BookID: 1, BookInfo: title, author, Shelf:
  // shelf1, Username: user1, ChatID: 1

  const message = `info base-command-handler ${logDate} - Success: "Book borrowed", Command: /start, BookID: ${row.bookID}, BookInfo: ${bookInfo}, Shelf: ${row.shelf}, Username: ${row.username}, ChatID: ${row.chatID}`;
  return {timestamp, message};
}

function createLogEventReturned(row) {
  const timestamp = parseDateToTimestamp(row.date);
  const timestampReturned = parseDateToTimestamp(row.returned);
  const logDate = convertTimestampToISO8601(timestamp);

  const bookInfo = row.author ? `${row.title}, ${row.author}` : row.title;

  const timeDiff = timestampReturned - timestamp;
  const daysBorrowed = Math.ceil(timeDiff / (1000 * 3600 * 24));

  //info callback-command-handler 2023-12-27T10:41:25.924Z - Success: "Book
  // returned", Callback: _return, BookID: 1, BookInfo: title, author,
  // DaysBorrowed: 6, Username: user1, ChatID: 1
  const message = `info callback-command-handler ${logDate} - Success: "Book returned", Callback: _return, BookID: ${row.bookID}, BookInfo: ${bookInfo}, DaysBorrowed: ${daysBorrowed}, Username: ${row.username}, ChatID: ${row.chatID}`;
  return {timestamp, message};
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

  // console.log(params);

  cloudwatchlogs.putLogEvents(params, (err, data) => {
    if (err) console.log(err, err.stack); else console.log(data);
  });
}

const logEventsBot = [];
// const logEventsBackend = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    logEventsBot.push(createLogEventReturned(row));
    // logEventsBot.push(createLogEventBorrowed(row));
    // logEventsBackend.push(createLogEventFound(row));
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    uploadLogEvents(logEventsBot, logGroupNameBot);
    // uploadLogEvents(logEventsBackend, logGroupNameBackend);
  });


// listLogGroups();
// listLogStreams(logGroupName);