import config from '../constants/config';
import {google} from "googleapis";
import {GetParameterCommand, SSMClient} from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({region: config.REGION});

async function getParameter(name: string,
                            withDecryption: boolean = false): Promise<string | null> {
  try {
    const command: GetParameterCommand = new GetParameterCommand({
      Name: name, WithDecryption: withDecryption
    });

    const response = await ssmClient.send(command);
    if (response.Parameter && response.Parameter.Value) {
      return response.Parameter.Value;
    } else {
      console.error(`Parameter ${name} not found or has no value`);
      return null;  // Return null or handle this scenario appropriately
    }
  } catch (error) {
    throw new Error(`Failed to get parameters from SSM`);
  }
}

async function getGoogleSheets(): Promise<any> {
  try {
    const clientEmail: string | null = await getParameter(config.CLIENT_EMAIL);
    if (clientEmail === null) {
      throw new Error(
        'Failed to retrieve client email for Google API authentication.');
    }
    const privateKey: string = (await getParameter(config.CLIENT_PRIVATE_KEY,
      true)).replace(
      /\\n/g, '\n');

    const client = new google.auth.JWT(clientEmail, null, privateKey,
      [config.SCOPE]);

    return google.sheets({version: 'v4', auth: client});
  } catch (error) {
    throw new Error(`Failed to get Google Sheets object`);
  }
}

module.exports.getRows = async (range: string): Promise<any[]> => {
  try {
    const spreadsheetId: string = config.SHEETS_ID;
    const sheets: any = await getGoogleSheets();

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

module.exports.appendRow =
  async (range: string, data: any[]): Promise<void> => {
  try {
    const spreadsheetId: string = config.SHEETS_ID;
    const sheets: any = await getGoogleSheets();

    const valueInputOption: string = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    await sheets.spreadsheets.values.append({
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

module.exports.updateRow = async (range: string, data: any[]) => {
  try {
    const spreadsheetId: string = config.SHEETS_ID;
    const sheets: any = await getGoogleSheets();

    const valueInputOption: string = 'USER_ENTERED';
    const resource = {
      values: [data],
    };

    await sheets.spreadsheets.values.update({
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