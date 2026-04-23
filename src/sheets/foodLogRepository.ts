import {
  appendRecordByHeaders,
  readRecordsByHeaders,
  SheetCellValue,
} from "./sheetAppendHelper.js";

export type FoodLogItem = {
  food_log_id: string;
  date: string;
  time?: string;
  meal_type?: string;
  status?: string;
  items_text?: string;
  product_links_json?: string;
  quantity_text?: string;

  energy_kcal?: number;
  energy_kj?: number;
  protein_g?: number;
  carbs_g?: number;
  sugars_g?: number;
  fat_g?: number;
  saturates_g?: number;
  fibre_g?: number;
  salt_g?: number;
  sodium_mg?: number;
  iron_mg?: number;
  calcium_mg?: number;
  magnesium_mg?: number;
  potassium_mg?: number;
  zinc_mg?: number;
  iodine_ug?: number;
  vitamin_b12_ug?: number;
  vitamin_d_ug?: number;
  folate_ug?: number;
  omega_3_g?: number;

  extra_nutrients_json?: string;
  calculation_method?: string;
  confidence?: number;
  notes?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: SheetCellValue | undefined;
};

export type FoodLogRow = {
  food_log_id: string;
  date: string;
  time?: string;
  meal_type?: string;
  items_text?: string;
  quantity_text?: string;
  energy_kcal?: string;
  protein_g?: string;
  carbs_g?: string;
  fat_g?: string;
  fibre_g?: string;
  notes?: string;
  status?: string;
  updated_at?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendFoodLogItem(item: FoodLogItem): Promise<void> {
  const timestamp = nowIso();

  await appendRecordByHeaders("FoodLog", {
    ...item,
    created_at: item.created_at ?? timestamp,
    updated_at: item.updated_at ?? timestamp,
  });
}

export async function listFoodLogItems(): Promise<FoodLogRow[]> {
  const rows = await readRecordsByHeaders("FoodLog");

  return rows
    .filter((row) => row.food_log_id || row.date || row.items_text)
    .map((row) => ({
      food_log_id: row.food_log_id ?? "",
      date: row.date ?? "",
      time: emptyToUndefined(row.time),
      meal_type: emptyToUndefined(row.meal_type),
      items_text: emptyToUndefined(row.items_text),
      quantity_text: emptyToUndefined(row.quantity_text),
      energy_kcal: emptyToUndefined(row.energy_kcal),
      protein_g: emptyToUndefined(row.protein_g),
      carbs_g: emptyToUndefined(row.carbs_g),
      fat_g: emptyToUndefined(row.fat_g),
      fibre_g: emptyToUndefined(row.fibre_g),
      notes: emptyToUndefined(row.notes),
      status: emptyToUndefined(row.status),
      updated_at: emptyToUndefined(row.updated_at),
    }));
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}
