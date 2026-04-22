import { appendRecordByHeaders, SheetCellValue } from "./sheetAppendHelper.js";

export type DailyNutritionSummary = {
  date: string;

  energy_kcal_total?: number;
  energy_kj_total?: number;
  protein_g_total?: number;
  carbs_g_total?: number;
  sugars_g_total?: number;
  fat_g_total?: number;
  saturates_g_total?: number;
  fibre_g_total?: number;
  salt_g_total?: number;
  sodium_mg_total?: number;
  iron_mg_total?: number;
  calcium_mg_total?: number;
  magnesium_mg_total?: number;
  potassium_mg_total?: number;
  zinc_mg_total?: number;
  iodine_ug_total?: number;
  vitamin_b12_ug_total?: number;
  vitamin_d_ug_total?: number;
  folate_ug_total?: number;
  omega_3_g_total?: number;

  extra_nutrients_json?: string;
  completeness?: string;
  confidence?: number;
  calculation_method?: string;
  notes?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: SheetCellValue | undefined;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendDailyNutritionSummary(
  summary: DailyNutritionSummary,
): Promise<void> {
  const timestamp = nowIso();

  await appendRecordByHeaders("DailyNutritionSummary", {
    ...summary,
    created_at: summary.created_at ?? timestamp,
    updated_at: summary.updated_at ?? timestamp,
  });
}