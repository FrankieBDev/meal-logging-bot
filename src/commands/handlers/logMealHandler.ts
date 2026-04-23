import { appendFoodLogItem } from "../../sheets/foodLogRepository.js";
import { type CommandResponse } from "../commandResponse";
import { type ParsedCommand } from "../commandTypes";
import {
  ValidationError,
  getOptionalTrimmedField,
  getRequiredTrimmedField,
  parseOptionalNumber,
} from "../validation";

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export async function handleLogMealCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    const date = getRequiredTrimmedField(parsedCommand.fields, "date");
    const mealType = getRequiredTrimmedField(parsedCommand.fields, "meal_type")
      .toLowerCase();
    const itemsText = getRequiredTrimmedField(parsedCommand.fields, "items_text");

    if (!VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number])) {
      throw new ValidationError("Invalid meal_type. Expected breakfast, lunch, dinner, or snack.");
    }

    const foodLogId = `food_${Date.now()}`;
    const time = getOptionalTrimmedField(parsedCommand.fields, "time");
    const quantityText = getOptionalTrimmedField(
      parsedCommand.fields,
      "quantity_text"
    );
    const notes = getOptionalTrimmedField(parsedCommand.fields, "notes");
    const source =
      getOptionalTrimmedField(parsedCommand.fields, "source") ?? "telegram";
    const status =
      getOptionalTrimmedField(parsedCommand.fields, "status") ?? "logged";
    const confidence =
      parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "confidence"),
        "confidence"
      ) ?? 1;

    await appendFoodLogItem({
      food_log_id: foodLogId,
      date,
      time,
      meal_type: mealType,
      status,
      items_text: itemsText,
      quantity_text: quantityText,
      energy_kcal: parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "energy_kcal"),
        "energy_kcal"
      ),
      protein_g: parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "protein_g"),
        "protein_g"
      ),
      carbs_g: parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "carbs_g"),
        "carbs_g"
      ),
      fat_g: parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "fat_g"),
        "fat_g"
      ),
      fibre_g: parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "fibre_g"),
        "fibre_g"
      ),
      confidence,
      notes,
      source,
    });

    return {
      status: "ok",
      message: `Meal logged: ${mealType}`,
      data: {
        food_log_id: foodLogId,
        date,
        meal_type: mealType,
        items_text: itemsText,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }
}
