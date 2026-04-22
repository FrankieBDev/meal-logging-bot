import { parseCommandText } from "./commandParser";
import { type CommandResponse } from "./commandResponse";
import { type BotCommand, type ParsedCommand } from "./commandTypes";
import { handleAddInventoryCommand } from "./handlers/addInventoryHandler";
import { handleHelpCommand } from "./handlers/helpHandler";

export async function routeCommandText(text: string): Promise<CommandResponse> {
  const parseResult = parseCommandText(text);

  if (!parseResult.success) {
    return {
      status: "error",
      message: parseResult.error.message,
      data: {
        code: parseResult.error.code,
      },
    };
  }

  return routeParsedCommand(parseResult.parsedCommand);
}

async function routeParsedCommand(
  parsedCommand: ParsedCommand
): Promise<CommandResponse> {
  switch (parsedCommand.command) {
    case "help":
      return handleHelpCommand();

    case "addInventory":
      return handleAddInventoryCommand(parsedCommand);

    case "logMeal":
    case "addProduct":
    case "closeDay":
    case "inventory":
    case "useSoon":
    case "gptToday":
    case "gptPlanContext":
      return recognisedButNotImplemented(parsedCommand.command);

    default:
      return assertNever(parsedCommand.command);
  }
}

function recognisedButNotImplemented(command: BotCommand): CommandResponse {
  return {
    status: "ok",
    message: `/${command} is recognised but not implemented yet.`,
    data: {
      command,
      implemented: false,
    },
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled command: ${value}`);
}
