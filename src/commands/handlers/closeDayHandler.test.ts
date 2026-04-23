import { beforeEach, describe, expect, it, vi } from "vitest";

import { appendDailyNote } from "../../sheets/dailyNotesRepository.js";
import { type CommandContext, type ParsedCommand } from "../commandTypes";
import { resetPendingActions } from "../pendingActionStore";
import {
  handleCancelCommandWithParsedCommand,
  handleConfirmCommand,
} from "./addProductHandler";
import { handleCloseDayCommand } from "./closeDayHandler";

vi.mock("../../sheets/dailyNotesRepository.js", () => ({
  appendDailyNote: vi.fn(),
}));

function buildParsedCommand(fields: Record<string, string>): ParsedCommand {
  return {
    command: "closeDay",
    rawText: "/closeDay",
    rawPayload: "",
    fields,
  };
}

function buildContext(actorId = "user-1"): CommandContext {
  return { actorId };
}

describe("close day preview flow", () => {
  beforeEach(() => {
    resetPendingActions();
    vi.mocked(appendDailyNote).mockReset();
    vi.mocked(appendDailyNote).mockResolvedValue(undefined);
  });

  it("creates a pending preview for a valid /closeDay command", async () => {
    const response = await handleCloseDayCommand(
      buildParsedCommand({
        date: "2026-04-23",
        mood: "calm",
        energy: "medium",
        appetite: "normal",
        cravings: "sweet",
        cycle_day: "14",
        notes: "steady day",
      }),
      buildContext()
    );

    expect(response.status).toBe("ok");
    expect(response.message).toContain("Close day preview:");
    expect(response.message).toContain("date: 2026-04-23");
    expect(response.message).toContain("mood: calm");
    expect(response.message).toContain("cycle_day: 14");
    expect(response.message).toContain("Send /confirm to save or /cancel to discard.");
    expect(appendDailyNote).not.toHaveBeenCalled();
  });

  it("fails validation when date is missing", async () => {
    const response = await handleCloseDayCommand(
      buildParsedCommand({
        notes: "steady day",
      }),
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message: "Missing required field: date",
    });
  });

  it("fails validation when cycle_day is invalid", async () => {
    const response = await handleCloseDayCommand(
      buildParsedCommand({
        date: "2026-04-23",
        cycle_day: "abc",
      }),
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message: "Invalid number for field: cycle_day",
    });
  });

  it("writes to DailyNotes on /confirm with a pending /closeDay preview", async () => {
    await handleCloseDayCommand(
      buildParsedCommand({
        date: "2026-04-23",
        mood: "calm",
        energy: "medium",
        appetite: "normal",
        cravings: "sweet",
        cycle_day: "14",
        notes: "steady day",
      }),
      buildContext()
    );

    const response = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(response).toEqual({
      status: "ok",
      message: "Day closed: 2026-04-23",
      data: {
        daily_note_id: expect.stringMatching(/^note_\d+$/),
        date: "2026-04-23",
      },
    });
    expect(appendDailyNote).toHaveBeenCalledWith(
      expect.objectContaining({
        daily_note_id: expect.stringMatching(/^note_\d+$/),
        date: "2026-04-23",
        mood: "calm",
        energy: "medium",
        hunger: "normal",
        cravings: "sweet",
        cycle_context: "day 14",
        notes: "steady day",
        source: "telegram",
        confidence: 1,
      })
    );
  });

  it("clears pending /closeDay preview on /cancel", async () => {
    await handleCloseDayCommand(
      buildParsedCommand({
        date: "2026-04-23",
      }),
      buildContext()
    );

    const cancelResponse = handleCancelCommandWithParsedCommand(
      {
        command: "cancel",
        rawText: "/cancel",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );
    const confirmResponse = await handleConfirmCommand(
      {
        command: "confirm",
        rawText: "/confirm",
        rawPayload: "",
        fields: {},
      },
      buildContext()
    );

    expect(cancelResponse).toEqual({
      status: "ok",
      message: "Pending close day preview cancelled.",
    });
    expect(confirmResponse).toEqual({
      status: "error",
      message: "No pending preview to confirm.",
    });
    expect(appendDailyNote).not.toHaveBeenCalled();
  });

  it("rejects unknown fields", async () => {
    const response = await handleCloseDayCommand(
      buildParsedCommand({
        date: "2026-04-23",
        extra: "oops",
      }),
      buildContext()
    );

    expect(response).toEqual({
      status: "error",
      message:
        "Unknown field: extra. Allowed fields: date, notes, mood, energy, appetite, cravings, cycle_day, source, confidence",
    });
  });
});
