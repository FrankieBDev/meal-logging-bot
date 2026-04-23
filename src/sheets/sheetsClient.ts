import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export class GoogleSheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSheetsConfigError";
  }
}

export async function createSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = new google.auth.GoogleAuth({
    keyFile: getRequiredGoogleEnv("GOOGLE_APPLICATION_CREDENTIALS"),
    scopes: SCOPES,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

export function getSpreadsheetId(): string {
  return getRequiredGoogleEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

function getRequiredGoogleEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new GoogleSheetsConfigError(
      `Missing required Google Sheets environment variable: ${name}`
    );
  }

  return value;
}
