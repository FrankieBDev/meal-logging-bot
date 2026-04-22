import { appendRecordByHeaders, SheetCellValue } from "./sheetAppendHelper.js";

export type InventoryItem = {
  inventory_id: string;
  product_id?: string;
  item_name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  quantity_description?: string;
  location?: string;
  bb_date?: string;
  use_by_date?: string;
  status?: string;
  is_staple?: boolean;
  priority?: string;
  source?: string;
  confidence?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: SheetCellValue | undefined;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendInventoryItem(item: InventoryItem): Promise<void> {
  const timestamp = nowIso();

  await appendRecordByHeaders("Inventory", {
    ...item,
    created_at: item.created_at ?? timestamp,
    updated_at: item.updated_at ?? timestamp,
  });
}