import {
  type ParseResult,
  SUPPORTED_COMMANDS,
} from "./commandTypes";

const FIELD_KEY_PATTERN = /^[A-Za-z0-9_]+$/;

export function parseCommandText(text: string): ParseResult {
  const rawText = text.trim();

  if (rawText.length === 0) {
    return {
      success: false,
      error: {
        code: "empty_message",
        message: "Message was empty.",
        rawText,
      },
    };
  }

  if (!rawText.startsWith("/")) {
    return {
      success: false,
      error: {
        code: "not_a_command",
        message: "Message must start with a slash command.",
        rawText,
      },
    };
  }

  const firstWhitespaceIndex = rawText.search(/\s/);
  const commandToken =
    firstWhitespaceIndex === -1
      ? rawText
      : rawText.slice(0, firstWhitespaceIndex);

  const command = SUPPORTED_COMMANDS[commandToken];

  if (!command) {
    return {
      success: false,
      error: {
        code: "unknown_command",
        message: `Unsupported command: ${commandToken}`,
        rawText,
      },
    };
  }

  const rawPayload =
    firstWhitespaceIndex === -1
      ? ""
      : rawText.slice(firstWhitespaceIndex).trim();

  const fieldsResult = parseFields(rawPayload, rawText);

  if (!fieldsResult.success) {
    return fieldsResult;
  }

  return {
    success: true,
    parsedCommand: {
      command,
      rawText,
      rawPayload,
      fields: fieldsResult.fields,
    },
  };
}

type FieldsParseResult =
  | {
      success: true;
      fields: Record<string, string>;
    }
  | {
      success: false;
      error: {
        code: "invalid_field_syntax";
        message: string;
        rawText: string;
      };
    };

function parseFields(payload: string, rawText: string): FieldsParseResult {
  const fields: Record<string, string> = {};
  let index = 0;

  while (index < payload.length) {
    index = skipWhitespace(payload, index);

    if (index >= payload.length) {
      break;
    }

    const keyStartIndex = index;

    while (index < payload.length && payload[index] !== "=" && !/\s/.test(payload[index])) {
      index += 1;
    }

    const key = payload.slice(keyStartIndex, index);

    if (!FIELD_KEY_PATTERN.test(key)) {
      return invalidFieldSyntax(rawText, `Invalid field key: ${key}`);
    }

    if (payload[index] !== "=") {
      return invalidFieldSyntax(rawText, `Expected "=" after field key: ${key}`);
    }

    index += 1;

    if (index >= payload.length) {
      return invalidFieldSyntax(rawText, `Missing value for field: ${key}`);
    }

    if (payload[index] === "\"") {
      const quotedValueResult = readQuotedValue(payload, index);

      if (!quotedValueResult.success) {
        return invalidFieldSyntax(rawText, `Missing closing quote for field: ${key}`);
      }

      fields[key] = quotedValueResult.value;
      index = quotedValueResult.nextIndex;
      continue;
    }

    const valueStartIndex = index;

    while (index < payload.length && !/\s/.test(payload[index])) {
      index += 1;
    }

    const value = payload.slice(valueStartIndex, index);

    if (value.length === 0) {
      return invalidFieldSyntax(rawText, `Missing value for field: ${key}`);
    }

    fields[key] = value;
  }

  return {
    success: true,
    fields,
  };
}

function skipWhitespace(text: string, startIndex: number): number {
  let index = startIndex;

  while (index < text.length && /\s/.test(text[index])) {
    index += 1;
  }

  return index;
}

type QuotedValueResult =
  | {
      success: true;
      value: string;
      nextIndex: number;
    }
  | {
      success: false;
    };

function readQuotedValue(payload: string, quoteStartIndex: number): QuotedValueResult {
  let index = quoteStartIndex + 1;
  let value = "";

  while (index < payload.length) {
    const character = payload[index];

    if (character === "\"") {
      return {
        success: true,
        value,
        nextIndex: index + 1,
      };
    }

    value += character;
    index += 1;
  }

  return {
    success: false,
  };
}

function invalidFieldSyntax(rawText: string, message: string): FieldsParseResult {
  return {
    success: false,
    error: {
      code: "invalid_field_syntax",
      message,
      rawText,
    },
  };
}