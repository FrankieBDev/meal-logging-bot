type LogLevel = "info" | "warn" | "error";

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, details?: unknown): void {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;

  if (details === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }

  console.log(`${prefix} ${message}`, sanitiseLogDetails(details));
}

function sanitiseLogDetails(details: unknown): unknown {
  if (!(details instanceof Error)) {
    return details;
  }

  return {
    name: details.name,
    message: details.message,
  };
}

export const logger = {
  info(message: string, details?: unknown): void {
    log("info", message, details);
  },

  warn(message: string, details?: unknown): void {
    log("warn", message, details);
  },

  error(message: string, details?: unknown): void {
    log("error", message, details);
  },
};
