const config = require("../constants/config");
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
    throw new Error(`Failed to get parameters from SSM`);
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
    throw new Error(`Failed to get Google Sheets object`);
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
    console.error(`Failed to read database`);
    console.error(error.message);
    console.error(error);
    throw error;
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

    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource,
    });
    console.log(`Row appended to ${spreadsheetId}`);
  } catch (error) {
    console.error(`Failed to update database`);
    console.error(error.message);
    console.error(error);
    throw error;
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
    console.log(`Row updated in ${spreadsheetId}`);
  } catch (error) {
    console.error(`Failed to update row in database`);
    console.error(error.message);
    console.error(error);
    throw error;
  }
};