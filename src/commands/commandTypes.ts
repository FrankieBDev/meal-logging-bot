export type BotCommand =
  | "help"
  | "addProduct"
  | "confirm"
  | "cancel"
  | "addInventory"
  | "logMeal"
  | "closeDay"
  | "inventory"
  | "useSoon"
  | "gptToday"
  | "gptPlanContext";

export type ParsedCommand = {
  command: BotCommand;
  rawText: string;
  rawPayload: string;
  fields: Record<string, string>;
};

export type CommandContext = {
  actorId?: string;
};

export type ParseResult =
  | {
      success: true;
      parsedCommand: ParsedCommand;
    }
  | {
      success: false;
      error: CommandParseError;
    };

export type CommandParseError = {
  code:
    | "empty_message"
    | "not_a_command"
    | "unknown_command"
    | "invalid_field_syntax";
  message: string;
  rawText: string;
};

export const SUPPORTED_COMMANDS: Record<string, BotCommand> = {
  "/help": "help",
  "/addProduct": "addProduct",
  "/confirm": "confirm",
  "/cancel": "cancel",
  "/addInventory": "addInventory",
  "/logMeal": "logMeal",
  "/closeDay": "closeDay",
  "/inventory": "inventory",
  "/useSoon": "useSoon",
  "/gptToday": "gptToday",
  "/gptPlanContext": "gptPlanContext",
};
