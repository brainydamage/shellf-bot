'use strict';
const {SSMClient, GetParameterCommand} = require("@aws-sdk/client-ssm");
const {google} = require('googleapis');
const telegramUtils = require('../utils/telegramUtils');

const ssmClient = new SSMClient({region: "eu-central-1"});

async function getParameter(name, withDecryption = false) {
  const command = new GetParameterCommand({
    Name: name, WithDecryption: withDecryption
  });

  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

async function appendToBooksLog(data) {
  const clientEmail = await getParameter('shellf_client_email');
  const privateKey = (await getParameter('shellf_private_key', true)).replace(
    /\\n/g, '\n');

  const client = new google.auth.JWT(clientEmail, null, privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']);

  const sheets = google.sheets({version: 'v4', auth: client});
  const spreadsheetId = '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc';
  const range = `booksLog`;

  const valueInputOption = 'USER_ENTERED';
  const resource = {
    values: [data],
  };

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log('Row appended to booksLog');
  } catch (error) {
    console.error(error);
    throw new Error('Error appending to booksLog');
  }
}

async function timestampToHumanReadable(timestamp) {
  const date = new Date(timestamp * 1000); // Convert Unix timestamp to
                                           // milliseconds

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

async function addOneMonthAndFormat(timestamp) {
  const date = new Date(timestamp * 1000); // Convert Unix timestamp to
                                           // milliseconds

  date.setMonth(date.getMonth() + 1); // Add one month

  const day = date.getDate().toString().padStart(2, '0'); // Format day
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Format
                                                                   // month
                                                                   // (getMonth()
                                                                   // returns
                                                                   // 0-11)
  const year = date.getFullYear(); // Get year

  return `${day}.${month}.${year}`;
}

module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log('bot handler triggered');
  console.log(JSON.stringify(body));

  //TODO handle two cases - user is new and user has a chat with bot
  if (body && body.message) {
    const msgText = body.message.text;
    let bookID;
    const parts = msgText.split(" ");
    // Check if the second part is a number
    if (parts.length > 1 && !isNaN(parts[1])) {
      bookID = parseInt(parts[1], 10);
      const chatID = body.message.from.id;
      const username = body.message.from.username || '';
      const timestamp = body.message.date;
      const dateTime = await timestampToHumanReadable(timestamp);
      const deadlineDate = await addOneMonthAndFormat(timestamp);
      const data = [dateTime, deadlineDate, username, chatID, bookID];

      try {
        //TODO consider saving to GS before sending tg message
        //pay attention to rollback mechanism
        await appendToBooksLog(data);
        await telegramUtils.deleteMessage(body);
        await telegramUtils.sendMessage(chatID,
          `успех! пожалуйста, верни книгу до ${deadlineDate}`);
      } catch (error) {
        console.error(`Failed to borrow a book`);
        console.error(error.message);
        console.error(error);
        if (error.message === 'Error appending to booksLog') {
          //send the help contact to user
        } else if (error.message === 'Failed to delete telegram message') {
          //pohui
        } else if (error.message === 'Failed to send telegram message') {
          //delete row from db and try send the help contact to user
        }
      }

    } else {
      console.error("The message does not contain a valid book id");
    }
  } else {
    console.warn("the payload is strange");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        input: event,
      },
      null,
      2
    ),
  };
};
