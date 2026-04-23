import { GoogleSheetsConfigError } from "../../sheets/sheetsClient.js";
import {
  listDailyNotes,
  type DailyNoteRow,
} from "../../sheets/dailyNotesRepository.js";
import {
  listFoodLogItems,
  type FoodLogRow,
} from "../../sheets/foodLogRepository.js";
import {
  listInventoryItems,
  type InventoryRow,
} from "../../sheets/inventoryRepository.js";
import { type CommandResponse } from "../commandResponse";
import { type ParsedCommand } from "../commandTypes";
import { formatGptPlanContextResponse, formatGptTodayResponse, formatInventoryResponse, formatUseSoonResponse } from "../retrievalFormatting";
import {
  ValidationError,
  assertNoUnknownFields,
  getOptionalField,
  getOptionalTrimmedField,
} from "../validation";

export async function handleInventoryCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, []);
    const items = (await listInventoryItems())
      .filter(isAvailableInventoryItem)
      .sort((a, b) => a.item_name.localeCompare(b.item_name));

    return {
      status: "ok",
      message: formatInventoryResponse(items),
    };
  } catch (error) {
    return handleRetrievalError(error, "Inventory retrieval is not available yet.");
  }
}

export async function handleUseSoonCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, []);
    const items = (await listInventoryItems())
      .filter(isAvailableInventoryItem)
      .filter((item) => item.use_by_date || item.bb_date)
      .sort(compareSoonestItems);

    return {
      status: "ok",
      message: formatUseSoonResponse(items),
    };
  } catch (error) {
    return handleRetrievalError(error, "Use-soon retrieval is not available yet.");
  }
}

export async function handleGptTodayCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, ["date"]);
    const date = resolveRequestedDate(parsedCommand);
    const meals = (await listFoodLogItems()).filter((item) => item.date === date);
    const notes = (await listDailyNotes()).filter((item) => item.date === date);
    const inventoryItems = (await listInventoryItems())
      .filter(isAvailableInventoryItem)
      .sort((a, b) => a.item_name.localeCompare(b.item_name));

    return {
      status: "ok",
      message: formatGptTodayResponse({
        date,
        meals: sortMealsNewestFirst(meals),
        notes: sortDailyNotesNewestFirst(notes),
        inventoryItems,
      }),
    };
  } catch (error) {
    return handleRetrievalError(error, "GPT today context is not available yet.");
  }
}

export async function handleGptPlanContextCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, []);
    const meals = sortMealsNewestFirst(await listFoodLogItems());
    const notes = sortDailyNotesNewestFirst(await listDailyNotes());
    const inventoryItems = (await listInventoryItems())
      .filter(isAvailableInventoryItem)
      .sort((a, b) => a.item_name.localeCompare(b.item_name));

    return {
      status: "ok",
      message: formatGptPlanContextResponse({
        meals,
        notes,
        inventoryItems,
      }),
    };
  } catch (error) {
    return handleRetrievalError(error, "GPT plan context is not available yet.");
  }
}

function resolveRequestedDate(parsedCommand: ParsedCommand): string {
  const rawDate = getOptionalField(parsedCommand.fields, "date");
  const requestedDate = getOptionalTrimmedField(parsedCommand.fields, "date");

  if (rawDate !== undefined && requestedDate === undefined) {
    throw new ValidationError("Missing required field: date");
  }

  if (requestedDate) {
    return requestedDate;
  }

  return new Date().toISOString().slice(0, 10);
}

function isAvailableInventoryItem(item: InventoryRow): boolean {
  const status = (item.status ?? "").trim().toLowerCase();

  return status === "" || status === "available" || status === "active";
}

function compareSoonestItems(a: InventoryRow, b: InventoryRow): number {
  const aDate = a.use_by_date ?? a.bb_date ?? "9999-12-31";
  const bDate = b.use_by_date ?? b.bb_date ?? "9999-12-31";

  if (aDate !== bDate) {
    return aDate.localeCompare(bDate);
  }

  return a.item_name.localeCompare(b.item_name);
}

function sortMealsNewestFirst(items: FoodLogRow[]): FoodLogRow[] {
  return [...items].sort((a, b) => {
    const aKey = `${a.date}|${a.time ?? ""}|${a.updated_at ?? ""}`;
    const bKey = `${b.date}|${b.time ?? ""}|${b.updated_at ?? ""}`;

    return bKey.localeCompare(aKey);
  });
}

function sortDailyNotesNewestFirst(items: DailyNoteRow[]): DailyNoteRow[] {
  return [...items].sort((a, b) => {
    const aKey = `${a.date}|${a.updated_at ?? ""}`;
    const bKey = `${b.date}|${b.updated_at ?? ""}`;

    return bKey.localeCompare(aKey);
  });
}

function handleRetrievalError(
  error: unknown,
  fallbackMessage: string
): CommandResponse {
  if (error instanceof ValidationError) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (error instanceof GoogleSheetsConfigError) {
    return {
      status: "error",
      message: fallbackMessage,
    };
  }

  throw error;
}
