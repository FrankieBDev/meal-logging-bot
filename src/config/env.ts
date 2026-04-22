import "dotenv/config";

type EnvConfig = {
  telegramBotToken: string;
  telegramAllowedUserId: string;
  googleSheetsSpreadsheetId: string;
  googleApplicationCredentials: string;
  port: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env: EnvConfig = {
  telegramBotToken: getRequiredEnv("TELEGRAM_BOT_TOKEN"),
  telegramAllowedUserId: getRequiredEnv("TELEGRAM_ALLOWED_USER_ID"),
  googleSheetsSpreadsheetId: getRequiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
  googleApplicationCredentials: getRequiredEnv("GOOGLE_APPLICATION_CREDENTIALS"),
  port: Number(process.env.PORT ?? 3000),
};