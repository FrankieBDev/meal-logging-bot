import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendFoodLogItem } from "../../sheets/foodLogRepository.js";
import { type ParsedCommand } from "../commandTypes";
import { handleLogMealCommand } from "./logMealHandler";

vi.mock("../../sheets/foodLogRepository.js", () => ({
  appendFoodLogItem: vi.fn(),
}));

function buildParsedCommand(fields: Record<string, string>): ParsedCommand {
  return {
    command: "logMeal",
    rawText: "/logMeal",
    rawPayload: "",
    fields,
  };
}

describe("handleLogMealCommand", () => {
  beforeEach(() => {
    vi.mocked(appendFoodLogItem).mockReset();
    vi.mocked(appendFoodLogItem).mockResolvedValue(undefined);
  });

  it("returns ok and writes the required fields only", async () => {
    const response = await handleLogMealCommand(
      buildParsedCommand({
        date: "2026-04-23",
        meal_type: "Dinner",
        items_text: "lentil pasta",
      })
    );

    expect(response.status).toBe("ok");
    expect(response.message).toBe("Meal logged: dinner");
    expect(response.data).toEqual({
      food_log_id: expect.stringMatching(/^food_\d+$/),
      date: "2026-04-23",
      meal_type: "dinner",
      items_text: "lentil pasta",
    });
    expect(appendFoodLogItem).toHaveBeenCalledWith(
      expect.objectContaining({
        food_log_id: expect.stringMatching(/^food_\d+$/),
        date: "2026-04-23",
        meal_type: "dinner",
        items_text: "lentil pasta",
        status: "logged",
        source: "telegram",
        confidence: 1,
      })
    );
  });

  it("parses optional numeric fields", async () => {
    await handleLogMealCommand(
      buildParsedCommand({
        date: "2026-04-23",
        meal_type: "snack",
        items_text: "banana and yoghurt",
        energy_kcal: "320",
        protein_g: "18",
        carbs_g: "35",
        fat_g: "9",
        fibre_g: "6",
        confidence: "0.8",
      })
    );

    expect(appendFoodLogItem).toHaveBeenCalledWith(
      expect.objectContaining({
        energy_kcal: 320,
        protein_g: 18,
        carbs_g: 35,
        fat_g: 9,
        fibre_g: 6,
        confidence: 0.8,
      })
    );
  });

  it("returns an error when a required field is missing", async () => {
    const response = await handleLogMealCommand(
      buildParsedCommand({
        date: "2026-04-23",
        meal_type: "lunch",
      })
    );

    expect(response.status).toBe("error");
    expect(response.message).toBe("Missing required field: items_text");
    expect(appendFoodLogItem).not.toHaveBeenCalled();
  });

  it("returns an error when a numeric field is invalid", async () => {
    const response = await handleLogMealCommand(
      buildParsedCommand({
        date: "2026-04-23",
        meal_type: "lunch",
        items_text: "rice bowl",
        energy_kcal: "abc",
      })
    );

    expect(response.status).toBe("error");
    expect(response.message).toBe("Invalid number for field: energy_kcal");
    expect(appendFoodLogItem).not.toHaveBeenCalled();
  });

  it("returns an error when meal_type is invalid", async () => {
    const response = await handleLogMealCommand(
      buildParsedCommand({
        date: "2026-04-23",
        meal_type: "brunch",
        items_text: "toast",
      })
    );

    expect(response.status).toBe("error");
    expect(response.message).toBe(
      "Invalid meal_type. Expected breakfast, lunch, dinner, or snack."
    );
    expect(appendFoodLogItem).not.toHaveBeenCalled();
  });
});
