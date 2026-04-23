import { type CommandResponse } from "../commandResponse";
import { type CommandContext, type ParsedCommand } from "../commandTypes";
import { setPendingAction } from "../pendingActionStore";
import {
  ValidationError,
  assertNoUnknownFields,
  getOptionalTrimmedField,
  getRequiredTrimmedField,
  parseOptionalNumber,
} from "../validation";

export async function handleCloseDayCommand(
  parsedCommand: ParsedCommand,
  context: CommandContext
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, [
      "date",
      "notes",
      "mood",
      "energy",
      "appetite",
      "cravings",
      "cycle_day",
      "source",
      "confidence",
    ]);

    const actorId = getRequiredActorId(context);
    const date = getRequiredTrimmedField(parsedCommand.fields, "date");
    const notes = getOptionalTrimmedField(parsedCommand.fields, "notes");
    const mood = getOptionalTrimmedField(parsedCommand.fields, "mood");
    const energy = getOptionalTrimmedField(parsedCommand.fields, "energy");
    const appetite = getOptionalTrimmedField(parsedCommand.fields, "appetite");
    const cravings = getOptionalTrimmedField(parsedCommand.fields, "cravings");
    const cycleDay = parseOptionalNumber(
      getOptionalTrimmedField(parsedCommand.fields, "cycle_day"),
      "cycle_day"
    );
    const source =
      getOptionalTrimmedField(parsedCommand.fields, "source") ?? "telegram";
    const confidence =
      parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "confidence"),
        "confidence"
      ) ?? 1;

    const dailyNoteId = `note_${Date.now()}`;

    setPendingAction({
      actorId,
      kind: "closeDay",
      dailyNoteId,
      date,
      notes,
      mood,
      energy,
      appetite,
      cravings,
      cycleDay,
      source,
      confidence,
    });

    return {
      status: "ok",
      message: buildPreviewMessage({
        dailyNoteId,
        date,
        notes,
        mood,
        energy,
        appetite,
        cravings,
        cycleDay,
        source,
        confidence,
      }),
      data: {
        preview_pending: true,
        daily_note_id: dailyNoteId,
        date,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }
}

function getRequiredActorId(context: CommandContext): string {
  const actorId = context.actorId?.trim();

  if (!actorId) {
    throw new Error("Missing required command context: actorId");
  }

  return actorId;
}

function buildPreviewMessage(preview: {
  dailyNoteId: string;
  date: string;
  notes?: string;
  mood?: string;
  energy?: string;
  appetite?: string;
  cravings?: string;
  cycleDay?: number;
  source: string;
  confidence: number;
}): string {
  return [
    "Close day preview:",
    `daily_note_id: ${preview.dailyNoteId}`,
    `date: ${preview.date}`,
    `mood: ${preview.mood ?? "-"}`,
    `energy: ${preview.energy ?? "-"}`,
    `appetite: ${preview.appetite ?? "-"}`,
    `cravings: ${preview.cravings ?? "-"}`,
    `cycle_day: ${preview.cycleDay ?? "-"}`,
    `notes: ${preview.notes ?? "-"}`,
    `source: ${preview.source}`,
    `confidence: ${preview.confidence}`,
    "",
    "Send /confirm to save or /cancel to discard.",
  ].join("\n");
}
