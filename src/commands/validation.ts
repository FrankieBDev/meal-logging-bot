export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function assertNoUnknownFields(
  fields: Record<string, string>,
  allowedFields: readonly string[]
): void {
  const allowedFieldSet = new Set(allowedFields);

  for (const key of Object.keys(fields)) {
    if (!allowedFieldSet.has(key)) {
      const allowedFieldsMessage =
        allowedFields.length > 0
          ? `Allowed fields: ${allowedFields.join(", ")}`
          : "This command does not accept fields.";

      throw new ValidationError(
        `Unknown field: ${key}. ${allowedFieldsMessage}`
      );
    }
  }
}

export function getRequiredField(
  fields: Record<string, string>,
  key: string
): string {
  const value = fields[key];

  if (value === undefined) {
    throw new ValidationError(`Missing required field: ${key}`);
  }

  return value;
}

export function getRequiredTrimmedField(
  fields: Record<string, string>,
  key: string
): string {
  const value = getRequiredField(fields, key).trim();

  if (value.length === 0) {
    throw new ValidationError(`Missing required field: ${key}`);
  }

  return value;
}

export function getOptionalField(
  fields: Record<string, string>,
  key: string
): string | undefined {
  return fields[key];
}

export function getOptionalTrimmedField(
  fields: Record<string, string>,
  key: string
): string | undefined {
  const value = getOptionalField(fields, key);

  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function parseRequiredNumber(value: string, fieldName: string): number {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new ValidationError(`Invalid number for field: ${fieldName}`);
  }

  return parsedValue;
}

export function parseOptionalNumber(
  value: string | undefined,
  fieldName: string
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseRequiredNumber(value, fieldName);
}

export function parseOptionalBoolean(
  value: string | undefined,
  fieldName: string
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalisedValue = value.toLowerCase();

  if (
    normalisedValue === "true" ||
    normalisedValue === "yes" ||
    normalisedValue === "y" ||
    normalisedValue === "1"
  ) {
    return true;
  }

  if (
    normalisedValue === "false" ||
    normalisedValue === "no" ||
    normalisedValue === "n" ||
    normalisedValue === "0"
  ) {
    return false;
  }

  throw new ValidationError(`Invalid boolean for field: ${fieldName}`);
}
