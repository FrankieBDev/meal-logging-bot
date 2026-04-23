import { parseCommandText } from "./commandParser";
import { type CommandResponse } from "./commandResponse";
import { type CommandContext, type ParsedCommand } from "./commandTypes";
import {
  handleAddProductCommand,
  handleCancelCommandWithParsedCommand,
  handleConfirmCommand,
} from "./handlers/addProductHandler";
import { handleAddInventoryCommand } from "./handlers/addInventoryHandler";
import { handleCloseDayCommand } from "./handlers/closeDayHandler";
import { handleHelpCommand } from "./handlers/helpHandler";
import { handleLogMealCommand } from "./handlers/logMealHandler";
import {
  handleGptPlanContextCommand,
  handleGptTodayCommand,
  handleInventoryCommand,
  handleUseSoonCommand,
} from "./handlers/retrievalHandlers";

export async function routeCommandText(
  text: string,
  context: CommandContext = {}
): Promise<CommandResponse> {
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

  return routeParsedCommand(parseResult.parsedCommand, context);
}

async function routeParsedCommand(
  parsedCommand: ParsedCommand,
  context: CommandContext
): Promise<CommandResponse> {
  switch (parsedCommand.command) {
    case "help":
      return handleHelpCommand();

    case "addProduct":
      return handleAddProductCommand(parsedCommand, context);

    case "confirm":
      return handleConfirmCommand(parsedCommand, context);

    case "cancel":
      return handleCancelCommandWithParsedCommand(parsedCommand, context);

    case "addInventory":
      return handleAddInventoryCommand(parsedCommand);

    case "logMeal":
      return handleLogMealCommand(parsedCommand);

    case "closeDay":
      return handleCloseDayCommand(parsedCommand, context);

    case "inventory":
      return handleInventoryCommand(parsedCommand);

    case "useSoon":
      return handleUseSoonCommand(parsedCommand);

    case "gptToday":
      return handleGptTodayCommand(parsedCommand);

    case "gptPlanContext":
      return handleGptPlanContextCommand(parsedCommand);

    default:
      return assertNever(parsedCommand.command);
  }
}
function assertNever(value: never): never {
  throw new Error(`Unhandled command: ${value}`);
}
