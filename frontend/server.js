// server.js
const express = require('express');
const {google} = require('googleapis');
const app = express();

app.use(express.static('public'));  // Serve static files

const PORT = process.env.PORT || 3000;
const CLIENT_EMAIL = process.env.SHELLF_CLIENT_EMAIL || '';
const PRIVATE_KEY = process.env.SHELLF_PRIVATE_KEY || '';

let key = PRIVATE_KEY;
if (PRIVATE_KEY.startsWith("")) {
  key = JSON.parse(PRIVATE_KEY);
}

console.log(`CLIENT_EMAIL = ${CLIENT_EMAIL}`);
console.log(`key = ${key}`);

const sheets = google.sheets({version: 'v4'});

const client = new google.auth.JWT(CLIENT_EMAIL, null,
  key, ['https://www.googleapis.com/auth/spreadsheets']);

client.authorize(function (err) {
  if (err) {
    console.log(`cannot authorize google client :(`)
    console.log(err);
  } else {
    console.log("Connected to Google Sheets API!");
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/book/:bookID', async (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/book/:bookID', async (req, res) => {
  // await delay(1000);

  // res.status(404).send('Book not found');

  const bookID = req.params.bookID;
  try {
    const bookDetails = await fetchBookDetails(bookID);
    if (bookDetails) {
      res.json(bookDetails);
    } else {
      res.status(404).send('Book not found');
    }
  } catch (error) {
    res.status(500).send('Error fetching book details');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function fetchBookDetails(bookID) {
  const request = {
    spreadsheetId: '1fbuYSBH3QIZgGX_bPuuLlXOJOBQ4mNKuev6zXDQYzhc',
    range: 'booksDB', // Replace with your actual sheet name and range
    auth: client,
  };

  try {
    const response = await sheets.spreadsheets.values.get(request);
    const rows = response.data.values;

    let rowNumber;
    if (bookID === "any") {
      rowNumber = Math.floor(Math.random() * 11145);
      console.log(`getting book ${rowNumber}`);
    } else {
      rowNumber = parseInt(bookID);
    }

    if (rows && rows.length > 0 && rowNumber!==0) {
      const row = rows[rowNumber];
      const bookInfo = { title: row[1], author: row[2] };
      console.log(bookInfo);

      return bookInfo;
    }

    return null; // Return null if no matching bookID is found
  } catch (err) {
    console.error('The API returned an error: ' + err);
  }
}

// function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }