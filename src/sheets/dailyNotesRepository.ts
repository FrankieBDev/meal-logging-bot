import {
  appendRecordByHeaders,
  readRecordsByHeaders,
  SheetCellValue,
} from "./sheetAppendHelper.js";

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

export type DailyNoteRow = {
  daily_note_id: string;
  date: string;
  energy?: string;
  hunger?: string;
  cravings?: string;
  mood?: string;
  cycle_context?: string;
  notes?: string;
  updated_at?: string;
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

export async function listDailyNotes(): Promise<DailyNoteRow[]> {
  const rows = await readRecordsByHeaders("DailyNotes");

  return rows
    .filter((row) => row.daily_note_id || row.date || row.notes)
    .map((row) => ({
      daily_note_id: row.daily_note_id ?? "",
      date: row.date ?? "",
      energy: emptyToUndefined(row.energy),
      hunger: emptyToUndefined(row.hunger),
      cravings: emptyToUndefined(row.cravings),
      mood: emptyToUndefined(row.mood),
      cycle_context: emptyToUndefined(row.cycle_context),
      notes: emptyToUndefined(row.notes),
      updated_at: emptyToUndefined(row.updated_at),
    }));
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}
