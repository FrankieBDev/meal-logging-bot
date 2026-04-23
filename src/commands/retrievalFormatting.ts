import { type DailyNoteRow } from "../sheets/dailyNotesRepository.js";
import { type FoodLogRow } from "../sheets/foodLogRepository.js";
import { type InventoryRow } from "../sheets/inventoryRepository.js";

const INVENTORY_LIMIT = 12;
const USE_SOON_LIMIT = 12;
const GPT_PLAN_MEAL_LIMIT = 5;
const GPT_PLAN_NOTE_LIMIT = 3;
const GPT_PLAN_INVENTORY_LIMIT = 8;

export function formatInventoryResponse(items: InventoryRow[]): string {
  if (items.length === 0) {
    return "Inventory is empty.";
  }

  const visibleItems = items.slice(0, INVENTORY_LIMIT);
  const lines = [
    "Inventory:",
    ...visibleItems.map((item) => `- ${formatInventoryItem(item)}`),
  ];

  if (items.length > INVENTORY_LIMIT) {
    lines.push(`...and ${items.length - INVENTORY_LIMIT} more items.`);
  }

  return lines.join("\n");
}

export function formatUseSoonResponse(items: InventoryRow[]): string {
  if (items.length === 0) {
    return "No active inventory items with use-by or best-before dates.";
  }

  const visibleItems = items.slice(0, USE_SOON_LIMIT);
  const lines = [
    "Use soon:",
    ...visibleItems.map((item) => {
      const label = item.use_by_date ? "use_by" : "bb_date";
      const date = item.use_by_date ?? item.bb_date ?? "-";
      return `- ${date} ${label}: ${formatInventoryItem(item)}`;
    }),
  ];

  if (items.length > USE_SOON_LIMIT) {
    lines.push(`...and ${items.length - USE_SOON_LIMIT} more dated items.`);
  }

  return lines.join("\n");
}

export function formatGptTodayResponse(input: {
  date: string;
  meals: FoodLogRow[];
  notes: DailyNoteRow[];
  inventoryItems: InventoryRow[];
}): string {
  const lines = [`GPT Today Context`, `date: ${input.date}`, ""];

  lines.push("Meals:");
  lines.push(
    ...(
      input.meals.length > 0
        ? input.meals.map((meal) => `- ${formatMealItem(meal)}`)
        : ["- none logged"]
    )
  );

  lines.push("", "Daily notes:");
  lines.push(
    ...(
      input.notes.length > 0
        ? input.notes.map((note) => `- ${formatDailyNote(note)}`)
        : ["- none logged"]
    )
  );

  if (input.inventoryItems.length > 0 && input.inventoryItems.length <= 5) {
    lines.push("", "Inventory snapshot:");
    lines.push(...input.inventoryItems.map((item) => `- ${formatInventoryItem(item)}`));
  }

  return lines.join("\n");
}

export function formatGptPlanContextResponse(input: {
  meals: FoodLogRow[];
  notes: DailyNoteRow[];
  inventoryItems: InventoryRow[];
}): string {
  const lines = ["GPT Plan Context", ""];
  const recentMeals = input.meals.slice(0, GPT_PLAN_MEAL_LIMIT);
  const recentNotes = input.notes.slice(0, GPT_PLAN_NOTE_LIMIT);
  const inventorySnapshot = input.inventoryItems.slice(0, GPT_PLAN_INVENTORY_LIMIT);

  lines.push("Recent meals:");
  lines.push(
    ...(recentMeals.length > 0
      ? recentMeals.map((meal) => `- ${formatMealItem(meal)}`)
      : ["- none logged"])
  );

  lines.push("", "Current inventory:");
  lines.push(
    ...(inventorySnapshot.length > 0
      ? inventorySnapshot.map((item) => `- ${formatInventoryItem(item)}`)
      : ["- none available"])
  );

  lines.push("", "Recent daily notes:");
  lines.push(
    ...(recentNotes.length > 0
      ? recentNotes.map((note) => `- ${formatDailyNote(note)}`)
      : ["- none logged"])
  );

  return lines.join("\n");
}

function formatInventoryItem(item: InventoryRow): string {
  const quantityPart =
    item.quantity && item.unit
      ? `${item.quantity} ${item.unit}`
      : item.quantity
        ? item.quantity
        : item.unit ?? "";
  const locationPart = item.location ? ` @ ${item.location}` : "";

  return `${item.item_name}${quantityPart ? `: ${quantityPart}` : ""}${locationPart}`;
}

function formatMealItem(meal: FoodLogRow): string {
  const mealType = meal.meal_type ?? "meal";
  const time = meal.time ? ` ${meal.time}` : "";
  const quantity = meal.quantity_text ? ` (${meal.quantity_text})` : "";
  const energy = meal.energy_kcal ? ` [${meal.energy_kcal} kcal]` : "";

  return `${meal.date} ${mealType}${time}: ${meal.items_text ?? "-"}${quantity}${energy}`;
}

function formatDailyNote(note: DailyNoteRow): string {
  const parts = [
    note.date,
    note.mood ? `mood=${note.mood}` : undefined,
    note.energy ? `energy=${note.energy}` : undefined,
    note.hunger ? `appetite=${note.hunger}` : undefined,
    note.cravings ? `cravings=${note.cravings}` : undefined,
    note.cycle_context ? `cycle=${note.cycle_context}` : undefined,
    note.notes ? `notes=${note.notes}` : undefined,
  ].filter(Boolean);

  return parts.join(" | ");
}
