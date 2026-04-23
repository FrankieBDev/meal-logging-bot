import {
  appendRecordByHeaders,
  readRecordsByHeaders,
  SheetCellValue,
} from "./sheetAppendHelper.js";

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

export type InventoryRow = {
  inventory_id: string;
  item_name: string;
  quantity?: string;
  unit?: string;
  location?: string;
  bb_date?: string;
  use_by_date?: string;
  status?: string;
  updated_at?: string;
  notes?: string;
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

export async function listInventoryItems(): Promise<InventoryRow[]> {
  const rows = await readRecordsByHeaders("Inventory");

  return rows
    .filter((row) => row.inventory_id || row.item_name)
    .map((row) => ({
      inventory_id: row.inventory_id ?? "",
      item_name: row.item_name ?? "",
      quantity: emptyToUndefined(row.quantity),
      unit: emptyToUndefined(row.unit),
      location: emptyToUndefined(row.location),
      bb_date: emptyToUndefined(row.bb_date),
      use_by_date: emptyToUndefined(row.use_by_date),
      status: emptyToUndefined(row.status),
      updated_at: emptyToUndefined(row.updated_at),
      notes: emptyToUndefined(row.notes),
    }));
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}
