import { appendProductCatalogueItem } from "../../sheets/productCatalogueRepository.js";
import {
  clearPendingAction,
  getPendingAction,
  setPendingAction,
} from "../pendingActionStore";
import { appendDailyNote } from "../../sheets/dailyNotesRepository.js";
import { type CommandResponse } from "../commandResponse";
import { type CommandContext, type ParsedCommand } from "../commandTypes";
import {
  ValidationError,
  assertNoUnknownFields,
  getOptionalTrimmedField,
  getRequiredTrimmedField,
  parseOptionalNumber,
} from "../validation";
import { GoogleSheetsConfigError } from "../../sheets/sheetsClient.js";

export async function handleAddProductCommand(
  parsedCommand: ParsedCommand,
  context: CommandContext
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, [
      "product_name",
      "brand",
      "category",
      "notes",
      "source",
      "confidence",
    ]);

    const actorId = getRequiredActorId(context);
    const productName = getRequiredTrimmedField(parsedCommand.fields, "product_name");
    const brand = getOptionalTrimmedField(parsedCommand.fields, "brand");
    const category = getOptionalTrimmedField(parsedCommand.fields, "category");
    const notes = getOptionalTrimmedField(parsedCommand.fields, "notes");
    const source =
      getOptionalTrimmedField(parsedCommand.fields, "source") ?? "telegram";
    const confidence =
      parseOptionalNumber(
        getOptionalTrimmedField(parsedCommand.fields, "confidence"),
        "confidence"
      ) ?? 1;

    const productId = `prod_${Date.now()}`;

    setPendingAction({
      actorId,
      kind: "addProduct",
      productId,
      productName,
      brand,
      category,
      notes,
      source,
      confidence,
    });

    return {
      status: "ok",
      message: buildPreviewMessage({
        productId,
        productName,
        brand,
        category,
        notes,
        source,
        confidence,
      }),
      data: {
        preview_pending: true,
        product_id: productId,
        product_name: productName,
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

export async function handleConfirmCommand(
  parsedCommand: ParsedCommand,
  context: CommandContext
): Promise<CommandResponse> {
  try {
    assertNoUnknownFields(parsedCommand.fields, []);

    const actorId = getRequiredActorId(context);
    const pendingAction = getPendingAction(actorId);

    if (!pendingAction) {
      return {
        status: "error",
        message: "No pending preview to confirm.",
      };
    }

    if (pendingAction.kind === "addProduct") {
      await appendProductCatalogueItem({
        productId: pendingAction.productId,
        productName: pendingAction.productName,
        brand: pendingAction.brand,
        category: pendingAction.category,
        notes: pendingAction.notes,
        source: pendingAction.source,
        confidence: pendingAction.confidence,
      });

      clearPendingAction(actorId);

      return {
        status: "ok",
        message: `Product added: ${pendingAction.productName}`,
        data: {
          product_id: pendingAction.productId,
          product_name: pendingAction.productName,
        },
      };
    }

    await appendDailyNote({
      daily_note_id: pendingAction.dailyNoteId,
      date: pendingAction.date,
      mood: pendingAction.mood,
      energy: pendingAction.energy,
      hunger: pendingAction.appetite,
      cravings: pendingAction.cravings,
      cycle_context:
        pendingAction.cycleDay === undefined
          ? undefined
          : `day ${pendingAction.cycleDay}`,
      notes: pendingAction.notes,
      source: pendingAction.source,
      confidence: pendingAction.confidence,
    });

    clearPendingAction(actorId);

    return {
      status: "ok",
      message: `Day closed: ${pendingAction.date}`,
      data: {
        daily_note_id: pendingAction.dailyNoteId,
        date: pendingAction.date,
      },
    };
  } catch (error) {
    if (error instanceof GoogleSheetsConfigError) {
      return {
        status: "error",
        message: "Google Sheets is not configured for preview confirmation yet.",
      };
    }

    throw error;
  }
}

export function handleCancelCommand(context: CommandContext): CommandResponse {
  return handleCancelCommandWithParsedCommand(
    {
      command: "cancel",
      rawText: "/cancel",
      rawPayload: "",
      fields: {},
    },
    context
  );
}

export function handleCancelCommandWithParsedCommand(
  parsedCommand: ParsedCommand,
  context: CommandContext
): CommandResponse {
  assertNoUnknownFields(parsedCommand.fields, []);

  const actorId = getRequiredActorId(context);
  const pendingAction = getPendingAction(actorId);

  if (!pendingAction) {
    return {
      status: "ok",
      message: "No pending preview to cancel.",
    };
  }

  clearPendingAction(actorId);

  return {
    status: "ok",
    message:
      pendingAction.kind === "addProduct"
        ? "Pending product preview cancelled."
        : "Pending close day preview cancelled.",
  };
}

function getRequiredActorId(context: CommandContext): string {
  const actorId = context.actorId?.trim();

  if (!actorId) {
    throw new Error("Missing required command context: actorId");
  }

  return actorId;
}

function buildPreviewMessage(preview: {
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  notes?: string;
  source: string;
  confidence: number;
}): string {
  return [
    "Product preview:",
    `product_id: ${preview.productId}`,
    `product_name: ${preview.productName}`,
    `brand: ${preview.brand ?? "-"}`,
    `category: ${preview.category ?? "-"}`,
    `notes: ${preview.notes ?? "-"}`,
    `source: ${preview.source}`,
    `confidence: ${preview.confidence}`,
    "",
    "Send /confirm to save or /cancel to discard.",
  ].join("\n");
}
