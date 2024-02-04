const {sheets} = require("@googleapis/sheets");
const {JWT} = require('google-auth-library');
const config = require("../constants/config");
const messages = require("../constants/messages");

let sheetsClient = null;

async function getGoogleSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    const clientEmail = process.env.CLIENT_EMAIL;
    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

    const client = new JWT({
      email: clientEmail, key: privateKey, scopes: [config.SCOPE],
    });

    sheetsClient = sheets({version: 'v4', auth: client});
    return sheetsClient;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_GET_GOOGLE_SHEETS);
  }
}

module.exports = {getGoogleSheetsClient};