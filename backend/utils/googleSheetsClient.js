const {google} = require("googleapis");
const {SSMClient, GetParameterCommand} = require("@aws-sdk/client-ssm");
const config = require("../constants/config");
const messages = require("../constants/messages");

const ssmClient = new SSMClient({region: config.REGION});
let sheetsClient = null;

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

async function getGoogleSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    const clientEmail = await getParameter(config.CLIENT_EMAIL);
    const privateKey = (await getParameter(config.CLIENT_PRIVATE_KEY,
      true)).replace(/\\n/g, '\n');

    const client = new google.auth.JWT(clientEmail, null, privateKey,
      [config.SCOPE]);

    sheetsClient = google.sheets({version: 'v4', auth: client});
    return sheetsClient;
  } catch (error) {
    // console.error(error);

    throw new Error(messages.FAILED_GET_GOOGLE_SHEETS);
  }
}

module.exports = {getGoogleSheetsClient};