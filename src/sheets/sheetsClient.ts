import { google, sheets_v4 } from "googleapis";
import { env } from "../config/env";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function createSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = new google.auth.GoogleAuth({
    keyFile: env.googleApplicationCredentials,
    scopes: SCOPES,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

export function getSpreadsheetId(): string {
  return env.googleSheetsSpreadsheetId;
}