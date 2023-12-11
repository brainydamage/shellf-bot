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
    throw new Error(messages.FAILED_GET_GOOGLE_SHEETS);
  }
}

module.exports.getRows = async (range) => {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();

    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});
    return response.data.values;
  } catch (error) {
    console.error(messages.FAILED_READ_DB);
    console.error(error.message);
    console.error(error);
    throw new Error(messages.FAILED_READ_DB);
  }
};

module.exports.getRow = async (sheetName, rowNumber) => {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();

    const range = `${sheetName}!A${rowNumber}:D${rowNumber}`;

    const response = await sheets.spreadsheets.values.get(
      {spreadsheetId, range});

    const rows = response.data.values;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(messages.FAILED_READ_DB);
    console.error(error.message);
    console.error(error);
    throw new Error(messages.FAILED_READ_DB);
  }
};

module.exports.appendRow = async (range, data) => {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log(`Row appended to ${spreadsheetId}, data: ${data}`);
  } catch (error) {
    console.error(messages.FAILED_UPDATE_DB);
    console.error(error.message);
    console.error(error);
    throw new Error(messages.FAILED_UPDATE_DB);
  }
};

module.exports.updateRow = async (range, data) => {
  try {
    const spreadsheetId = config.SHEETS_ID;
    const sheets = await getGoogleSheets();

    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log(`Row updated in ${spreadsheetId}, data: ${data}`);
  } catch (error) {
    console.error(messages.FAILED_UPDATE_ROW_DB);
    console.error(error.message);
    console.error(error);
    throw new Error(messages.FAILED_UPDATE_ROW_DB);
  }
};