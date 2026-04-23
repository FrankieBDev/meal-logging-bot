import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleSheetsConfigError } from "../../sheets/sheetsClient.js";
import { listDailyNotes } from "../../sheets/dailyNotesRepository.js";
import { listFoodLogItems } from "../../sheets/foodLogRepository.js";
import { listInventoryItems } from "../../sheets/inventoryRepository.js";
import {
  handleGptPlanContextCommand,
  handleGptTodayCommand,
  handleInventoryCommand,
  handleUseSoonCommand,
} from "./retrievalHandlers";

vi.mock("../../sheets/inventoryRepository.js", () => ({
  listInventoryItems: vi.fn(),
}));

vi.mock("../../sheets/foodLogRepository.js", () => ({
  listFoodLogItems: vi.fn(),
}));

vi.mock("../../sheets/dailyNotesRepository.js", () => ({
  listDailyNotes: vi.fn(),
}));

describe("retrieval handlers", () => {
  beforeEach(() => {
    vi.mocked(listInventoryItems).mockReset();
    vi.mocked(listFoodLogItems).mockReset();
    vi.mocked(listDailyNotes).mockReset();
  });

  it("returns available inventory items", async () => {
    vi.mocked(listInventoryItems).mockResolvedValue([
      { inventory_id: "1", item_name: "red lentils", quantity: "500", unit: "g", status: "available" },
      { inventory_id: "2", item_name: "old item", status: "used" },
    ]);

    const response = await handleInventoryCommand({
      command: "inventory",
      rawText: "/inventory",
      rawPayload: "",
      fields: {},
    });

    expect(response.status).toBe("ok");
    expect(response.message).toContain("red lentils: 500 g");
    expect(response.message).not.toContain("old item");
  });

  it("returns use-soon items sorted by date", async () => {
    vi.mocked(listInventoryItems).mockResolvedValue([
      { inventory_id: "2", item_name: "milk", use_by_date: "2026-04-24", status: "available" },
      { inventory_id: "1", item_name: "yoghurt", bb_date: "2026-04-23", status: "available" },
    ]);

    const response = await handleUseSoonCommand({
      command: "useSoon",
      rawText: "/useSoon",
      rawPayload: "",
      fields: {},
    });

    expect(response.status).toBe("ok");
    expect(response.message).toContain("2026-04-23 bb_date: yoghurt");
    expect(response.message.indexOf("yoghurt")).toBeLessThan(
      response.message.indexOf("milk")
    );
  });

  it("returns gpt today context for the requested date", async () => {
    vi.mocked(listFoodLogItems).mockResolvedValue([
      { food_log_id: "1", date: "2026-04-23", meal_type: "lunch", items_text: "rice bowl" },
      { food_log_id: "2", date: "2026-04-22", meal_type: "dinner", items_text: "soup" },
    ]);
    vi.mocked(listDailyNotes).mockResolvedValue([
      { daily_note_id: "1", date: "2026-04-23", mood: "calm" },
    ]);
    vi.mocked(listInventoryItems).mockResolvedValue([
      { inventory_id: "1", item_name: "eggs", quantity: "6", unit: "items", status: "available" },
    ]);

    const response = await handleGptTodayCommand({
      command: "gptToday",
      rawText: "/gptToday",
      rawPayload: "",
      fields: { date: "2026-04-23" },
    });

    expect(response.status).toBe("ok");
    expect(response.message).toContain("date: 2026-04-23");
    expect(response.message).toContain("rice bowl");
    expect(response.message).toContain("mood=calm");
  });

  it("returns gpt plan context from recent rows", async () => {
    vi.mocked(listFoodLogItems).mockResolvedValue([
      { food_log_id: "1", date: "2026-04-23", meal_type: "dinner", items_text: "lentil pasta" },
    ]);
    vi.mocked(listDailyNotes).mockResolvedValue([
      { daily_note_id: "1", date: "2026-04-22", notes: "steady day" },
    ]);
    vi.mocked(listInventoryItems).mockResolvedValue([
      { inventory_id: "1", item_name: "eggs", quantity: "6", unit: "items", status: "available" },
    ]);

    const response = await handleGptPlanContextCommand({
      command: "gptPlanContext",
      rawText: "/gptPlanContext",
      rawPayload: "",
      fields: {},
    });

    expect(response.status).toBe("ok");
    expect(response.message).toContain("GPT Plan Context");
    expect(response.message).toContain("lentil pasta");
    expect(response.message).toContain("eggs: 6 items");
    expect(response.message).toContain("steady day");
  });

  it("returns a clean error when Google Sheets config is missing", async () => {
    vi.mocked(listInventoryItems).mockRejectedValue(
      new GoogleSheetsConfigError("Sheets missing")
    );

    const response = await handleInventoryCommand({
      command: "inventory",
      rawText: "/inventory",
      rawPayload: "",
      fields: {},
    });

    expect(response).toEqual({
      status: "error",
      message: "Inventory retrieval is not available yet.",
    });
  });

  it("rejects unknown fields for /gptToday", async () => {
    const response = await handleGptTodayCommand({
      command: "gptToday",
      rawText: "/gptToday",
      rawPayload: "foo=bar",
      fields: { foo: "bar" },
    });

    expect(response).toEqual({
      status: "error",
      message: "Unknown field: foo. Allowed fields: date",
    });
  });
});
