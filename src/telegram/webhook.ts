import { routeCommandText } from "../commands/commandRouter.js";
import { env } from "../config/env.js";
import { logger } from "../logger.js";
import { sendTelegramMessage } from "./sendMessage.js";

type TelegramWebhookMessage = {
  chat?: {
    id?: number | string;
  };
  from?: {
    id?: number | string;
  };
  text?: unknown;
};

type TelegramWebhookBody = {
  message?: TelegramWebhookMessage;
};

type TelegramWebhookResult = {
  statusCode: number;
  body: Record<string, unknown>;
};

export async function processTelegramWebhook(
  body: TelegramWebhookBody
): Promise<TelegramWebhookResult> {
  const senderId = body.message?.from?.id;

  if (!senderId) {
    logger.warn("Rejected Telegram webhook: missing sender ID");

    return {
      statusCode: 400,
      body: {
        status: "rejected",
        reason: "missing_sender_id",
      },
    };
  }

  if (String(senderId) !== env.telegramAllowedUserId) {
    logger.warn("Rejected Telegram webhook from unauthorised user", {
      senderId,
    });

    return {
      statusCode: 403,
      body: {
        status: "rejected",
        reason: "unauthorised_user",
      },
    };
  }

  const messageText = body.message?.text;

  if (typeof messageText !== "string") {
    logger.warn("Rejected Telegram webhook: missing message text", {
      senderId,
    });

    return {
      statusCode: 400,
      body: {
        status: "rejected",
        reason: "missing_message_text",
      },
    };
  }

  const chatId = body.message?.chat?.id;

  if (!chatId) {
    logger.warn("Rejected Telegram webhook: missing chat ID", {
      senderId,
    });

    return {
      statusCode: 400,
      body: {
        status: "rejected",
        reason: "missing_chat_id",
      },
    };
  }

  logger.info("Accepted Telegram webhook command", {
    senderId,
    messageText,
  });

  const commandResponse = await routeCommandText(messageText);
  const commandToken = extractCommandToken(messageText);

  try {
    await sendTelegramMessage(chatId, commandResponse.message);

    return {
      statusCode: 200,
      body: {
        status: "ok",
        command: commandToken,
        telegram_reply_sent: true,
        commandResponse,
      },
    };
  } catch (error) {
    logger.error("Failed to send Telegram reply", {
      chatId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return {
      statusCode: 200,
      body: {
        status: "partial_success",
        command: commandToken,
        telegram_reply_sent: false,
        reason: "telegram_send_failed",
        commandResponse,
      },
    };
  }
}

function extractCommandToken(text: string): string {
  const trimmedText = text.trim();
  const firstWhitespaceIndex = trimmedText.search(/\s/);

  if (firstWhitespaceIndex === -1) {
    return trimmedText;
  }

  return trimmedText.slice(0, firstWhitespaceIndex);
}
