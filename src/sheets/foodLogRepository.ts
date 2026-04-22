import { appendRecordByHeaders, SheetCellValue } from "./sheetAppendHelper.js";

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