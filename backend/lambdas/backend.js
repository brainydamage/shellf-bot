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
  // console.log(event);
  const requestedBookID = event.pathParameters.bookID;
  console.log(`bookID requested = ${requestedBookID}`);

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
    console.log(`found ${rows.length}`);

    if (rows && rows.length > 0 && requestedBookID !== 0) {
      const row = rows[requestedBookID];
      const bookID = row[0];

      if (bookID === requestedBookID) {
        bookTitle = row[1];
        bookAuthor = row[2];
      } else {
        console.log(`!!! book is on the wrong place, searching...`);

        console.log(`bookID = ${bookID}`);
        console.log(`requestedBookID = ${requestedBookID}`);

        for (const row of rows) {
          if (row[0] === requestedBookID) {
            bookTitle = row[1];
            bookAuthor = row[2];
          }
        }
      }

      console.log(`${bookTitle} by ${bookAuthor}`);
    }

  } catch (error) {
    console.log(`failed to access database`);
    console.log(error);

    return {
      statusCode: 500,
      body: JSON.stringify({message: "Error accessing database"}),
    };
  }

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
};
