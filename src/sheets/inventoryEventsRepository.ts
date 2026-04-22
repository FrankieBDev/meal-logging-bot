import { appendRecordByHeaders, SheetCellValue } from "./sheetAppendHelper.js";

export type InventoryEvent = {
  event_id: string;
  date: string;
  time?: string;
  event_type: string;
  inventory_id?: string;
  product_id?: string;
  item_name?: string;
  quantity_change?: number;
  unit?: string;
  previous_quantity?: number;
  new_quantity?: number;
  location?: string;
  bb_date?: string;
  use_by_date?: string;
  reason?: string;
  source?: string;
  confidence?: number;
  warning?: string;
  notes?: string;
  created_at?: string;
  [key: string]: SheetCellValue | undefined;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendInventoryEvent(event: InventoryEvent): Promise<void> {
  await appendRecordByHeaders("InventoryEvents", {
    ...event,
    created_at: event.created_at ?? nowIso(),
  });
}