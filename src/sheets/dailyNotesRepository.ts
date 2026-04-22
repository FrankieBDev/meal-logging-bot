import { appendRecordByHeaders, SheetCellValue } from "./sheetAppendHelper.js";

export type DailyNote = {
  daily_note_id: string;
  date: string;
  energy?: string;
  hunger?: string;
  cravings?: string;
  mood?: string;
  sleep?: string;
  exercise?: string;
  steps?: number;
  cycle_context?: string;
  office_day?: boolean;
  capacity?: string;
  notes?: string;
  source?: string;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: SheetCellValue | undefined;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendDailyNote(note: DailyNote): Promise<void> {
  const timestamp = nowIso();

  await appendRecordByHeaders("DailyNotes", {
    ...note,
    created_at: note.created_at ?? timestamp,
    updated_at: note.updated_at ?? timestamp,
  });
}