import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export class GoogleSheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSheetsConfigError";
  }
}

export async function createSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = createGoogleSheetsAuth();

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

function createGoogleSheetsAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (serviceAccountEmail || serviceAccountPrivateKey) {
    if (!serviceAccountEmail) {
      throw new GoogleSheetsConfigError(
        "Missing required Google Sheets environment variable: GOOGLE_SERVICE_ACCOUNT_EMAIL"
      );
    }

    if (!serviceAccountPrivateKey) {
      throw new GoogleSheetsConfigError(
        "Missing required Google Sheets environment variable: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
      );
    }

    return new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: normalisePrivateKey(serviceAccountPrivateKey),
      },
      scopes: SCOPES,
    });
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    return new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });
  }

  throw new GoogleSheetsConfigError(
    "Missing Google Sheets credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS for local development."
  );
}

function normalisePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

export function toGoogleSheetsConfigError(
  error: unknown
): GoogleSheetsConfigError | null {
  if (error instanceof GoogleSheetsConfigError) {
    return error;
  }

  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("private key") ||
    message.includes("invalid_grant") ||
    message.includes("unable to parse key") ||
    message.includes("no key or keyfile set") ||
    message.includes("credentials") ||
    message.includes("authentication")
  ) {
    return new GoogleSheetsConfigError(
      "Google Sheets authentication failed. Check service account configuration."
    );
  }

  return null;
}
