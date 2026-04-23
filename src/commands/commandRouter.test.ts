import { beforeEach, describe, expect, it, vi } from "vitest";

import { routeCommandText } from "./commandRouter";
import { appendDailyNote } from "../sheets/dailyNotesRepository.js";
import { listDailyNotes } from "../sheets/dailyNotesRepository.js";
import { listFoodLogItems } from "../sheets/foodLogRepository.js";
import { appendInventoryItem } from "../sheets/inventoryRepository.js";
import { listInventoryItems } from "../sheets/inventoryRepository.js";
import { appendFoodLogItem } from "../sheets/foodLogRepository.js";
import { appendProductCatalogueItem } from "../sheets/productCatalogueRepository.js";
import { resetPendingActions } from "./pendingActionStore";

vi.mock("../sheets/inventoryRepository.js", () => ({
  appendInventoryItem: vi.fn(),
  listInventoryItems: vi.fn(),
}));

vi.mock("../sheets/foodLogRepository.js", () => ({
  appendFoodLogItem: vi.fn(),
  listFoodLogItems: vi.fn(),
}));

vi.mock("../sheets/productCatalogueRepository.js", () => ({
  appendProductCatalogueItem: vi.fn(),
}));

vi.mock("../sheets/dailyNotesRepository.js", () => ({
  appendDailyNote: vi.fn(),
  listDailyNotes: vi.fn(),
}));

describe("routeCommandText", () => {
  beforeEach(() => {
    resetPendingActions();
    vi.mocked(appendInventoryItem).mockReset();
    vi.mocked(appendInventoryItem).mockResolvedValue(undefined);
    vi.mocked(listInventoryItems).mockReset();
    vi.mocked(listInventoryItems).mockResolvedValue([]);
    vi.mocked(appendFoodLogItem).mockReset();
    vi.mocked(appendFoodLogItem).mockResolvedValue(undefined);
    vi.mocked(listFoodLogItems).mockReset();
    vi.mocked(listFoodLogItems).mockResolvedValue([]);
    vi.mocked(appendProductCatalogueItem).mockReset();
    vi.mocked(appendProductCatalogueItem).mockResolvedValue(undefined);
    vi.mocked(appendDailyNote).mockReset();
    vi.mocked(appendDailyNote).mockResolvedValue(undefined);
    vi.mocked(listDailyNotes).mockReset();
    vi.mocked(listDailyNotes).mockResolvedValue([]);
  });

  it("returns help text for /help", async () => {
    const response = await routeCommandText("/help");

    expect(response.status).toBe("ok");
    expect(response.message).toContain("Meal Logging Bot help");
    expect(response.message).toContain("/addInventory");
    expect(response.message).toContain("/logMeal");
  });

  it("returns an error response for non-command text", async () => {
    const response = await routeCommandText("hello bot");

    expect(response.status).toBe("error");
    expect(response.data?.code).toBe("not_a_command");
  });

  it("returns an error response for unknown commands", async () => {
    const response = await routeCommandText("/dance");

    expect(response.status).toBe("error");
    expect(response.data?.code).toBe("unknown_command");
  });

  it("returns an error for /addInventory when item_name is missing", async () => {
    const response = await routeCommandText("/addInventory quantity=500 unit=g");

    expect(response.status).toBe("error");
    expect(response.message).toBe("Missing required field: item_name");
    expect(appendInventoryItem).not.toHaveBeenCalled();
  });

  it("returns an error for /addInventory when quantity is missing", async () => {
    const response = await routeCommandText(
      '/addInventory item_name="red lentils" unit=g'
    );

    expect(response.status).toBe("error");
    expect(response.message).toBe("Missing required field: quantity");
    expect(appendInventoryItem).not.toHaveBeenCalled();
  });

  it("returns an error for /addInventory when quantity is invalid", async () => {
    const response = await routeCommandText(
      '/addInventory item_name="red lentils" quantity=abc unit=g'
    );

    expect(response.status).toBe("error");
    expect(response.message).toBe("Invalid number for field: quantity");
    expect(appendInventoryItem).not.toHaveBeenCalled();
  });

  it("delegates /logMeal to the log meal handler flow", async () => {
    const response = await routeCommandText(
      '/logMeal date=2026-04-23 meal_type=Lunch items_text="rice bowl"'
    );

    expect(response.status).toBe("ok");
    expect(response.message).toBe("Meal logged: lunch");
    expect(response.data?.meal_type).toBe("lunch");
    expect(appendFoodLogItem).toHaveBeenCalledWith(
      expect.objectContaining({
        food_log_id: expect.stringMatching(/^food_\d+$/),
        date: "2026-04-23",
        meal_type: "lunch",
        items_text: "rice bowl",
        status: "logged",
        source: "telegram",
        confidence: 1,
      })
    );
  });

  it("routes /addProduct preview and /confirm using actor-scoped pending state", async () => {
    const previewResponse = await routeCommandText(
      '/addProduct product_name="Greek yoghurt" brand=Fage category=dairy',
      { actorId: "user-1" }
    );

    expect(previewResponse.status).toBe("ok");
    expect(previewResponse.message).toContain("Product preview:");
    expect(previewResponse.message).toContain("Send /confirm to save or /cancel to discard.");
    expect(appendProductCatalogueItem).not.toHaveBeenCalled();

    const confirmResponse = await routeCommandText("/confirm", {
      actorId: "user-1",
    });

    expect(confirmResponse).toEqual({
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
        source: "telegram",
        confidence: 1,
      })
    );
  });

  it("routes /closeDay preview and /confirm using actor-scoped pending state", async () => {
    const previewResponse = await routeCommandText(
      '/closeDay date=2026-04-23 mood=calm energy=medium appetite=normal notes="steady day"',
      { actorId: "user-1" }
    );

    expect(previewResponse.status).toBe("ok");
    expect(previewResponse.message).toContain("Close day preview:");
    expect(appendDailyNote).not.toHaveBeenCalled();

    const confirmResponse = await routeCommandText("/confirm", {
      actorId: "user-1",
    });

    expect(confirmResponse).toEqual({
      status: "ok",
      message: "Day closed: 2026-04-23",
      data: {
        daily_note_id: expect.stringMatching(/^note_\d+$/),
        date: "2026-04-23",
      },
    });
    expect(appendDailyNote).toHaveBeenCalledWith(
      expect.objectContaining({
        daily_note_id: expect.stringMatching(/^note_\d+$/),
        date: "2026-04-23",
        mood: "calm",
        energy: "medium",
        hunger: "normal",
        notes: "steady day",
        source: "telegram",
        confidence: 1,
      })
    );
  });

  it("routes /inventory to retrieval output", async () => {
    vi.mocked(listInventoryItems).mockResolvedValue([
      { inventory_id: "1", item_name: "eggs", quantity: "6", unit: "items", status: "available" },
    ]);

    const response = await routeCommandText("/inventory");

    expect(response.status).toBe("ok");
    expect(response.message).toContain("Inventory:");
    expect(response.message).toContain("eggs: 6 items");
  });

  it("passes unknown-field errors through for implemented read commands", async () => {
    const response = await routeCommandText("/inventory extra=yes");

    expect(response).toEqual({
      status: "error",
      message: "Unknown field: extra. This command does not accept fields.",
    });
  });
});
