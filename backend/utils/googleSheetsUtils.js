const config = require("../constants/config");
const messages = require("../constants/messages");
const {google} = require("googleapis");
const {SSMClient, GetParameterCommand} = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({region: config.REGION});

async function getParameter(name, withDecryption = false) {
  try {
    const command = new GetParameterCommand({
      Name: name, WithDecryption: withDecryption
    });

    const response = await ssmClient.send(command);
    return response.Parameter.Value;
  } catch (error) {
    throw new Error(messages.FAILED_GET_SSM);
  }
}

async function getGoogleSheets() {
  try {
    const clientEmail = await getParameter(config.CLIENT_EMAIL);
    const privateKey = (await getParameter(config.CLIENT_PRIVATE_KEY,
      true)).replace(
      /\\n/g, '\n');

    const client = new google.auth.JWT(clientEmail, null, privateKey,
      [config.SCOPE]);

    return google.sheets({version: 'v4', auth: client});
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_GET_GOOGLE_SHEETS);
  }
}

async function extractBookDetails(row) {
  const bookTitle = row[config.TITLE_COLUMN];
  const bookAuthor = row[config.AUTHOR_COLUMN];
  return {title: bookTitle, author: bookAuthor};
}

async function processBookData(rows, requestedBookID) {
  let bookTitle = "";
  let bookAuthor = "";

  // Search for a specific book by ID
  for (const row of rows) {
    const currentBookID = parseInt(row[config.ID_COLUMN], 10);
    if (!isNaN(currentBookID) && currentBookID === requestedBookID) {
      bookTitle = row[config.TITLE_COLUMN];
      bookAuthor = row[config.AUTHOR_COLUMN];
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

  const row = await getRow(config.BOOKS_DB,
    requestedBookID + 1, "A", "D");
  if (row && parseInt(row[config.ID_COLUMN], 10) === requestedBookID) {
    // Found the book in the expected row
    book = await extractBookDetails(row);
  } else {
    // Fallback to linear search
    book = await linearSearchForBook(requestedBookID);
  }

  return book;
}

async function getRows(range) {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();

    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});
    return response.data.values;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_READ_DB);
  }
}

async function getRow(sheetName, rowNumber, firstColumn, lastColumn) {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();
    const range = `${sheetName}!${firstColumn}${rowNumber}:${lastColumn}${rowNumber}`;

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
    const sheets = await getGoogleSheets();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
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
    const sheets = await getGoogleSheets();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log(`Row updated in ${spreadsheetId}, data: ${data}`);

  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_UPDATE_ROW_DB);
  }
}

module.exports = {
  getBookData,
  getRow,
  getRows,
  appendRow,
  updateRow
};