import { describe, expect, it } from "vitest";

import { parseCommandText } from "./commandParser";

describe("parseCommandText", () => {
  it("returns empty_message for an empty message", () => {
    const result = parseCommandText("");

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("empty_message");
    }
  });

  it("returns not_a_command for plain text", () => {
    const result = parseCommandText("hello bot");

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("not_a_command");
    }
  });

  it("returns unknown_command for unsupported slash commands", () => {
    const result = parseCommandText("/dance");

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("unknown_command");
    }
  });

  it("parses /help with no payload", () => {
    const result = parseCommandText("/help");

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.parsedCommand.command).toBe("help");
      expect(result.parsedCommand.rawPayload).toBe("");
      expect(result.parsedCommand.fields).toEqual({});
    }
  });

  it("parses unquoted key-value fields", () => {
    const result = parseCommandText(
      "/addInventory item_name=lentils quantity=500 unit=g location=cupboard"
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.parsedCommand.command).toBe("addInventory");
      expect(result.parsedCommand.fields).toEqual({
        item_name: "lentils",
        quantity: "500",
        unit: "g",
        location: "cupboard",
      });
    }
  });

  it("parses quoted multi-word values", () => {
    const result = parseCommandText(
      '/addInventory item_name="red lentils" quantity=500 unit=g location="top cupboard"'
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.parsedCommand.fields).toEqual({
        item_name: "red lentils",
        quantity: "500",
        unit: "g",
        location: "top cupboard",
      });
    }
  });

  it("preserves raw payload", () => {
    const rawPayload = 'item_name="red lentils" quantity=500 unit=g';
    const result = parseCommandText(`/addInventory ${rawPayload}`);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.parsedCommand.rawPayload).toBe(rawPayload);
    }
  });

  it("returns invalid_field_syntax for malformed fields", () => {
    const result = parseCommandText("/addInventory item_name");

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("invalid_field_syntax");
    }
  });

  it("returns a helpful error for unquoted multi-word values", () => {
    const result = parseCommandText(
      "/addInventory item_name=red lentils quantity=500 unit=g"
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("invalid_field_syntax");
      expect(result.error.message).toBe(
        'Invalid field format near: lentils. Multi-word values must be wrapped in quotes.'
      );
    }
  });

  it("allows empty quoted values", () => {
    const result = parseCommandText('/addInventory item_name="red lentils" notes=""');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.parsedCommand.fields.notes).toBe("");
    }
  });
});
