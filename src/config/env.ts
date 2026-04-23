import "dotenv/config";

type EnvConfig = {
  telegramBotToken: string;
  telegramAllowedUserId: string;
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
  port: Number(process.env.PORT ?? 3000),
};
