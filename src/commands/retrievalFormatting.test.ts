import { describe, expect, it } from "vitest";

import { formatGptPlanContextResponse, formatGptTodayResponse, formatInventoryResponse, formatUseSoonResponse } from "./retrievalFormatting";

describe("retrieval formatting", () => {
  it("formats inventory items compactly", () => {
    const message = formatInventoryResponse([
      {
        inventory_id: "inv_1",
        item_name: "red lentils",
        quantity: "500",
        unit: "g",
        location: "cupboard",
      },
    ]);

    expect(message).toBe("Inventory:\n- red lentils: 500 g @ cupboard");
  });

  it("formats use-soon items with their earliest dates", () => {
    const message = formatUseSoonResponse([
      {
        inventory_id: "inv_1",
        item_name: "yoghurt",
        quantity: "500",
        unit: "g",
        use_by_date: "2026-04-24",
      },
    ]);

    expect(message).toBe("Use soon:\n- 2026-04-24 use_by: yoghurt: 500 g");
  });

  it("formats gpt today context with meals and notes", () => {
    const message = formatGptTodayResponse({
      date: "2026-04-23",
      meals: [
        {
          food_log_id: "food_1",
          date: "2026-04-23",
          meal_type: "lunch",
          items_text: "rice bowl",
          energy_kcal: "550",
        },
      ],
      notes: [
        {
          daily_note_id: "note_1",
          date: "2026-04-23",
          mood: "calm",
          energy: "medium",
        },
      ],
      inventoryItems: [],
    });

    expect(message).toContain("GPT Today Context");
    expect(message).toContain("Meals:");
    expect(message).toContain("2026-04-23 lunch: rice bowl [550 kcal]");
    expect(message).toContain("Daily notes:");
    expect(message).toContain("2026-04-23 | mood=calm | energy=medium");
  });

  it("formats gpt plan context with compact sections", () => {
    const message = formatGptPlanContextResponse({
      meals: [
        {
          food_log_id: "food_1",
          date: "2026-04-23",
          meal_type: "dinner",
          items_text: "lentil pasta",
        },
      ],
      notes: [],
      inventoryItems: [
        {
          inventory_id: "inv_1",
          item_name: "eggs",
          quantity: "6",
          unit: "items",
        },
      ],
    });

    expect(message).toContain("GPT Plan Context");
    expect(message).toContain("Recent meals:");
    expect(message).toContain("Current inventory:");
    expect(message).toContain("Recent daily notes:");
  });
});
