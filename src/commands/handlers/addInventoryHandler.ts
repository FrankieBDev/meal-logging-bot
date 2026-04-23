import { type CommandResponse } from "../commandResponse";
import { type ParsedCommand } from "../commandTypes";
import {
  ValidationError,
  getOptionalField,
  getRequiredField,
  parseOptionalBoolean,
  parseOptionalNumber,
  parseRequiredNumber,
} from "../validation";
import { appendInventoryItem } from "../../sheets/inventoryRepository.js";
import { GoogleSheetsConfigError } from "../../sheets/sheetsClient.js";

export async function handleAddInventoryCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  try {
    const itemName = getRequiredField(parsedCommand.fields, "item_name");
    const quantityValue = getRequiredField(parsedCommand.fields, "quantity");
    const unit = getRequiredField(parsedCommand.fields, "unit");

    const quantity = parseRequiredNumber(quantityValue, "quantity");
    const confidence =
      parseOptionalNumber(
        getOptionalField(parsedCommand.fields, "confidence"),
        "confidence"
      ) ?? 1;
    const isStaple =
      parseOptionalBoolean(
        getOptionalField(parsedCommand.fields, "is_staple"),
        "is_staple"
      ) ?? false;

    const inventoryId = `inv_${Date.now()}`;

    await appendInventoryItem({
      inventory_id: inventoryId,
      product_id: getOptionalField(parsedCommand.fields, "product_id"),
      item_name: itemName,
      category: getOptionalField(parsedCommand.fields, "category"),
      quantity,
      unit,
      quantity_description: getOptionalField(
        parsedCommand.fields,
        "quantity_description"
      ),
      location: getOptionalField(parsedCommand.fields, "location"),
      bb_date: getOptionalField(parsedCommand.fields, "bb_date"),
      use_by_date: getOptionalField(parsedCommand.fields, "use_by_date"),
      status: getOptionalField(parsedCommand.fields, "status") ?? "available",
      is_staple: isStaple,
      priority: getOptionalField(parsedCommand.fields, "priority"),
      source: "telegram",
      confidence,
      notes: getOptionalField(parsedCommand.fields, "notes"),
    });

    return {
      status: "ok",
      message: `Inventory item added: ${itemName}`,
      data: {
        inventory_id: inventoryId,
        item_name: itemName,
        quantity,
        unit,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    if (error instanceof GoogleSheetsConfigError) {
      return {
        status: "error",
        message: "Google Sheets is not configured for inventory commands yet.",
      };
    }

    throw error;
  }
}
