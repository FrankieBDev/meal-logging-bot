import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../commands/commandRouter.js", () => ({
  routeCommandText: vi.fn(),
}));

vi.mock("./sendMessage.js", () => ({
  sendTelegramMessage: vi.fn(),
}));

import { routeCommandText } from "../commands/commandRouter.js";
import { sendTelegramMessage } from "./sendMessage.js";
import { processTelegramWebhook } from "./webhook";

describe("processTelegramWebhook", () => {
  beforeEach(() => {
    vi.mocked(routeCommandText).mockReset();
    vi.mocked(sendTelegramMessage).mockReset();
    vi.mocked(routeCommandText).mockResolvedValue({
      status: "ok",
      message: "Meal Logging Bot help",
    });
    vi.mocked(sendTelegramMessage).mockResolvedValue(undefined);
  });

  it("sends the command response message back to Telegram", async () => {
    const result = await processTelegramWebhook({
      message: {
        from: { id: process.env.TELEGRAM_ALLOWED_USER_ID },
        chat: { id: 12345 },
        text: "/help",
      },
    });

    expect(result).toEqual({
      statusCode: 200,
      body: {
        status: "ok",
        command: "/help",
        telegram_reply_sent: true,
        commandResponse: {
          status: "ok",
          message: "Meal Logging Bot help",
        },
      },
    });
    expect(routeCommandText).toHaveBeenCalledWith("/help", {
      actorId: String(process.env.TELEGRAM_ALLOWED_USER_ID),
    });
    expect(sendTelegramMessage).toHaveBeenCalledWith(12345, "Meal Logging Bot help");
  });

  it("returns partial_success when Telegram reply sending fails", async () => {
    vi.mocked(routeCommandText).mockResolvedValue({
      status: "ok",
      message: "Inventory item added: red lentils",
    });
    vi.mocked(sendTelegramMessage).mockRejectedValue(
      new Error("Telegram sendMessage failed with status 500")
    );

    const result = await processTelegramWebhook({
      message: {
        from: { id: process.env.TELEGRAM_ALLOWED_USER_ID },
        chat: { id: 12345 },
        text: '/addInventory item_name="red lentils" quantity=500 unit=g',
      },
    });

    expect(result).toEqual({
      statusCode: 200,
      body: {
        status: "partial_success",
        command: "/addInventory",
        telegram_reply_sent: false,
        reason: "telegram_send_failed",
        commandResponse: {
          status: "ok",
          message: "Inventory item added: red lentils",
        },
      },
    });
  });

  it("rejects an unauthorised sender before routing or sending", async () => {
    const result = await processTelegramWebhook({
      message: {
        from: { id: "999999" },
        chat: { id: 12345 },
        text: "/help",
      },
    });

    expect(result).toEqual({
      statusCode: 403,
      body: {
        status: "rejected",
        reason: "unauthorised_user",
      },
    });
    expect(routeCommandText).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });
});
