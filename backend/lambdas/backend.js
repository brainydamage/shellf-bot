'use strict';
const {SSMClient, GetParameterCommand} = require("@aws-sdk/client-ssm");
const {google} = require('googleapis');

const ssmClient = new SSMClient({region: "eu-central-1"});

async function getParameter(name, withDecryption = false) {
  const command = new GetParameterCommand({
    Name: name, WithDecryption: withDecryption
  });

  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

module.exports.handler = async (event) => {
  console.log('backend handler triggered');
  let requestedBookID = event.pathParameters.bookID;

  // Check if requestedBookID is 'any' or a valid integer
  if (requestedBookID !== 'any') {
    requestedBookID = parseInt(requestedBookID, 10);
    if (isNaN(requestedBookID)) {
      console.warn(`Invalid bookID format: ${event.pathParameters.bookID}`);
      return {
        statusCode: 404,
        body: JSON.stringify({message: "Not valid book id"}, null, 2),
      };
    }
  }

  const clientEmail = await getParameter('shellf_client_email');
  const privateKey = (await getParameter('shellf_private_key', true)).replace(
    /\\n/g, '\n');

  const client = new google.auth.JWT(clientEmail, null, privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']);

  const sheets = google.sheets({version: 'v4', auth: client});
  const spreadsheetId = '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc';
  const range = `booksDB`;

  let bookTitle = "";
  let bookAuthor = "";

  try {
    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});
    const rows = response.data.values;

    if (requestedBookID === 'any') {
      if (rows.length > 0) {
        const randomIndex = Math.floor(Math.random() * rows.length);
        const randomRow = rows[randomIndex];
        bookTitle = randomRow[1];
        bookAuthor = randomRow[2];
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({message: "No books available"}, null, 2),
        };
      }
    } else if (rows && rows.length > 0 && requestedBookID !== 0) {
      let bookFound = false;

      // Check if requestedBookID is within the range and matches the bookID
      if (requestedBookID < rows.length) {
        const row = rows[requestedBookID];
        if (!isNaN(row[0])) {
          const bookID = parseInt(row[0], 10);

          if (bookID === requestedBookID) {
            bookTitle = row[1];
            bookAuthor = row[2];
            bookFound = true;
          }
        } else {
          console.warn(
            `1 Invalid bookID ${row[0]} in the database on the row ${requestedBookID}`);
        }
      }

      // If not found directly, search through all rows
      if (!bookFound) {
        console.log(
          `!!! book ${requestedBookID} is on the wrong place, searching...`);

        let isFirstRow = true;
        for (const row of rows) {
          if (isFirstRow) {
            isFirstRow = false;
            continue;
          }

          let currentBookID = parseInt(row[0], 10);
          if (isNaN(currentBookID)) {
            console.warn(
              `2 Invalid bookID ${row[0]} in the database on the row ${requestedBookID}`);
          } else if (currentBookID === requestedBookID) {
            bookTitle = row[1];
            bookAuthor = row[2];
            break;
          }
        }
      }
    }
  } catch
    (error) {
    console.error(`failed to access database`);
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({message: "Error accessing database"}),
    };
  }

  console.log(`${bookTitle} by ${bookAuthor}`);

  return (bookTitle !== '' && bookAuthor !== '') ?
    {
      statusCode: 200,
      body: JSON.stringify({
        title: bookTitle,
        author: bookAuthor,
      }, null, 2),
    } :
    {
      statusCode: 400,
      body: JSON.stringify({message: "Book not found"}, null, 2),
    };
}
;
