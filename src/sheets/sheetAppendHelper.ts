import {
  createSheetsClient,
  getSpreadsheetId,
  toGoogleSheetsConfigError,
} from "./sheetsClient.js";

export type SheetCellValue = string | number | boolean;
export type SheetRecord = Record<string, SheetCellValue | undefined>;

function valueOrBlank(value: SheetCellValue | undefined): SheetCellValue | "" {
  return value ?? "";
}

export async function appendRecordByHeaders(
  sheetName: string,
  record: SheetRecord,
): Promise<void> {
  try {
    const sheets = await createSheetsClient();

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!1:1`,
    });

    const headers = headerResponse.data.values?.[0];

    if (!headers || headers.length === 0) {
      throw new Error(`No header row found for sheet: ${sheetName}`);
    }

    const row = headers.map((header) => {
      const key = String(header).trim();
      return valueOrBlank(record[key]);
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: `${sheetName}!A:ZZ`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });
  } catch (error) {
    const configError = toGoogleSheetsConfigError(error);

    if (configError) {
      throw configError;
    }

    throw error;
  }
}
