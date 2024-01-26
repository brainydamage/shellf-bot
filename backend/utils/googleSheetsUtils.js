const config = require("../constants/config");
const messages = require("../constants/messages");
const {getGoogleSheetsClient} = require('./googleSheetsClient');

async function extractBookDetails(row) {
  const bookTitle = row[config.TITLE_COLUMN_DB];
  const bookAuthor = row[config.AUTHOR_COLUMN_DB];
  return {title: bookTitle, author: bookAuthor};
}

async function processBookData(rows, requestedBookID) {
  let bookTitle = "";
  let bookAuthor = "";

  // Search for a specific book by ID
  for (const row of rows) {
    const currentBookID = parseInt(row[config.BOOKID_COLUMN_DB], 10);
    if (!isNaN(currentBookID) && currentBookID === requestedBookID) {
      bookTitle = row[config.TITLE_COLUMN_DB];
      bookAuthor = row[config.AUTHOR_COLUMN_DB];
      return {title: bookTitle, author: bookAuthor};
    }
  }

  // Book not found
  return null;
}

async function linearSearchForBook(requestedBookID) {
  const rows = await getRows(config.BOOKS_DB);
  return await processBookData(rows, requestedBookID);
}

async function getBookData(requestedBookID) {
  let book;

  const row = await getRow(config.BOOKS_DB, requestedBookID + 1);
  if (row && parseInt(row[config.BOOKID_COLUMN_DB], 10) === requestedBookID) {
    // Found the book in the expected row
    book = await extractBookDetails(row);
  } else {
    // Fallback to linear search
    book = await linearSearchForBook(requestedBookID);
  }

  return book;
}

function getColumnLetter(columnNumber) {
  let letter = '';
  let base = 26;
  let tempNumber = columnNumber;

  while (tempNumber >= 0) {
    let remainder = tempNumber % base;
    letter = String.fromCharCode(65 + remainder) + letter;
    tempNumber = Math.floor(tempNumber / base) - 1;
  }

  return letter;
}

async function getRows(range) {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});
    return response.data.values;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_READ_DB);
  }
}

async function getRow(sheetName, rowNumber, firstColumn = 0,
                      lastColumn = null) {
  try {
    const firstColLetter = getColumnLetter(firstColumn);
    const lastColLetter = lastColumn !== null ? getColumnLetter(lastColumn) :
      '';

    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheetsClient();

    const range = `${sheetName}!${firstColLetter}${rowNumber}:${lastColLetter}${rowNumber}`;

    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});

    const rows = response.data.values;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_READ_DB);
  }
}

async function appendRow(range, data) {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheetsClient();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId, range, valueInputOption, resource,
    });

    console.log(`Row appended to ${spreadsheetId}, data: ${data}`);

    return result;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_UPDATE_DB);
  }
}

async function updateRow(range, data) {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheetsClient();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };
    await sheets.spreadsheets.values.update({
      spreadsheetId, range, valueInputOption, resource,
    });
    console.log(`Row updated in ${spreadsheetId}, data: ${data}`);

  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_UPDATE_ROW_DB);
  }
}

module.exports = {
  getBookData, getRow, getRows, appendRow, updateRow
};