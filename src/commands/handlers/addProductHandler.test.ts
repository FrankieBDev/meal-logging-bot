import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendDailyNote } from "../../sheets/dailyNotesRepository.js";
import { appendProductCatalogueItem } from "../../sheets/productCatalogueRepository.js";
import { GoogleSheetsConfigError } from "../../sheets/sheetsClient.js";
import { type CommandContext, type ParsedCommand } from "../commandTypes";
import { resetPendingActions } from "../pendingActionStore";
import {
  handleAddProductCommand,
  handleCancelCommandWithParsedCommand,
  handleConfirmCommand,
} from "./addProductHandler";

vi.mock("../../sheets/productCatalogueRepository.js", () => ({
  appendProductCatalogueItem: vi.fn(),
}));

vi.mock("../../sheets/dailyNotesRepository.js", () => ({
  appendDailyNote: vi.fn(),
}));

function buildParsedCommand(fields: Record<string, string>): ParsedCommand {
  return {
    command: "addProduct",
    rawText: "/addProduct",
    rawPayload: "",
    fields,
  };
}

function buildContext(actorId = "user-1"): CommandContext {
  return { actorId };
}

describe("add product preview flow", () => {
  beforeEach(() => {
    resetPendingActions();
    vi.mocked(appendProductCatalogueItem).mockReset();
    vi.mocked(appendProductCatalogueItem).mockResolvedValue(undefined);
    vi.mocked(appendDailyNote).mockReset();
    vi.mocked(appendDailyNote).mockResolvedValue(undefined);
  });

  it("creates a pending preview for a valid /addProduct command", async () => {
    const response = await handleAddProductCommand(
      buildParsedCommand({
        product_name: "Greek yoghurt",
        brand: "Fage",
        category: "dairy",
      }),
      buildContext()
    );

    expect(response.status).toBe("ok");
    expect(response.message).toContain("Product preview:");
    expect(response.message).toContain("product_name: Greek yoghurt");
    expect(response.message).toContain("brand: Fage");
    expect(response.message).toContain("category: dairy");
    expect(response.message).toContain("Send /confirm to save or /cancel to discard.");
    expect(appendProductCatalogueItem).not.toHaveBeenCalled();
  });

  it("fails validation when product_name is missing", async () => {
    const response = await handleAddProductCommand(
      buildParsedCommand({
        brand: "Fage",
      }),
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message: "Missing required field: product_name",
    });
  });

  it("returns a clean error for /confirm without a pending preview", async () => {
    const response = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message: "No pending preview to confirm.",
    });
  });

  it("returns a clean message for /cancel without a pending preview", () => {
    const response = handleCancelCommandWithParsedCommand(
      {
        command: "cancel",
        rawText: "/cancel",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(response).toEqual({
      status: "ok",
      message: "No pending preview to cancel.",
    });
  });

  it("writes to ProductCatalogue on /confirm with a pending preview", async () => {
    await handleAddProductCommand(
      buildParsedCommand({
        product_name: "Greek yoghurt",
        brand: "Fage",
        category: "dairy",
        notes: "high protein",
        confidence: "0.9",
      }),
      buildContext()
    );

    const response = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(response).toEqual({
      status: "ok",
      message: "Product added: Greek yoghurt",
      data: {
        product_id: expect.stringMatching(/^prod_\d+$/),
        product_name: "Greek yoghurt",
      },
    });
    expect(appendProductCatalogueItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: expect.stringMatching(/^prod_\d+$/),
        productName: "Greek yoghurt",
        brand: "Fage",
        category: "dairy",
        notes: "high protein",
        source: "telegram",
        confidence: 0.9,
      })
    );
  });

  it("clears pending preview on /cancel", async () => {
    await handleAddProductCommand(
      buildParsedCommand({
        product_name: "Greek yoghurt",
      }),
      buildContext()
    );

    const cancelResponse = handleCancelCommandWithParsedCommand(
      {
        command: "cancel",
        rawText: "/cancel",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );
    const confirmResponse = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(cancelResponse).toEqual({
      status: "ok",
      message: "Pending product preview cancelled.",
    });
    expect(confirmResponse).toEqual({
      status: "error",
      message: "No pending preview to confirm.",
    });
    expect(appendProductCatalogueItem).not.toHaveBeenCalled();
  });

  it("returns a clean error when product config is missing on /confirm", async () => {
    await handleAddProductCommand(
      buildParsedCommand({
        product_name: "Greek yoghurt",
      }),
      buildContext()
    );

    vi.mocked(appendProductCatalogueItem).mockRejectedValue(
      new GoogleSheetsConfigError("Google Sheets auth missing")
    );

    const response = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message: "Google Sheets is not configured for preview confirmation yet.",
    });
  });

  it("rejects unknown fields for /addProduct", async () => {
    const response = await handleAddProductCommand(
      buildParsedCommand({
        product_name: "Greek yoghurt",
        extra: "oops",
      }),
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message:
        "Unknown field: extra. Allowed fields: product_name, brand, category, notes, source, confidence",
    });
  });
});
