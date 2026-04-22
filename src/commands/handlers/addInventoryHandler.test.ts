import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendInventoryItem } from "../../sheets/inventoryRepository.js";
import { handleAddInventoryCommand } from "./addInventoryHandler";
import { type ParsedCommand } from "../commandTypes";

vi.mock("../../sheets/inventoryRepository.js", () => ({
  appendInventoryItem: vi.fn(),
}));

function buildParsedCommand(
  fields: Record<string, string>
): ParsedCommand {
  return {
    command: "addInventory",
    rawText: "/addInventory",
    rawPayload: "",
    fields,
  };
}

describe("handleAddInventoryCommand", () => {
  beforeEach(() => {
    vi.mocked(appendInventoryItem).mockReset();
    vi.mocked(appendInventoryItem).mockResolvedValue(undefined);
  });

  it("calls the repository and returns ok for valid required fields", async () => {
    const response = await handleAddInventoryCommand(
      buildParsedCommand({
        item_name: "red lentils",
        quantity: "500",
        unit: "g",
      })
    );

    expect(response.status).toBe("ok");
    expect(response.message).toBe("Inventory item added: red lentils");
    expect(response.data?.item_name).toBe("red lentils");
    expect(response.data?.quantity).toBe(500);
    expect(response.data?.unit).toBe("g");

    expect(appendInventoryItem).toHaveBeenCalledTimes(1);
    expect(appendInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        inventory_id: expect.stringMatching(/^inv_\d+$/),
        item_name: "red lentils",
        quantity: 500,
        unit: "g",
        status: "available",
        source: "telegram",
        confidence: 1,
        is_staple: false,
      })
    );
  });

  it("converts is_staple=yes to true", async () => {
    await handleAddInventoryCommand(
      buildParsedCommand({
        item_name: "red lentils",
        quantity: "500",
        unit: "g",
        is_staple: "yes",
      })
    );

    expect(appendInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        is_staple: true,
      })
    );
  });

  it("converts is_staple=no to false", async () => {
    await handleAddInventoryCommand(
      buildParsedCommand({
        item_name: "red lentils",
        quantity: "500",
        unit: "g",
        is_staple: "no",
      })
    );

    expect(appendInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        is_staple: false,
      })
    );
  });
});
