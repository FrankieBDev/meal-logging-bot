import { beforeEach, describe, expect, it, vi } from "vitest";

import { routeCommandText } from "./commandRouter";
import { appendInventoryItem } from "../sheets/inventoryRepository.js";
import { appendFoodLogItem } from "../sheets/foodLogRepository.js";

vi.mock("../sheets/inventoryRepository.js", () => ({
  appendInventoryItem: vi.fn(),
}));

vi.mock("../sheets/foodLogRepository.js", () => ({
  appendFoodLogItem: vi.fn(),
}));

describe("routeCommandText", () => {
  beforeEach(() => {
    vi.mocked(appendInventoryItem).mockReset();
    vi.mocked(appendInventoryItem).mockResolvedValue(undefined);
    vi.mocked(appendFoodLogItem).mockReset();
    vi.mocked(appendFoodLogItem).mockResolvedValue(undefined);
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

  it("returns placeholder response for other recognised but unimplemented commands", async () => {
    const response = await routeCommandText("/inventory");

    expect(response.status).toBe("ok");
    expect(response.message).toContain("recognised but not implemented yet");
    expect(response.data?.command).toBe("inventory");
    expect(response.data?.implemented).toBe(false);
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
});
