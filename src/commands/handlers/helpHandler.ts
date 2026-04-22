import { type CommandResponse } from "../commandResponse";

export function handleHelpCommand(): CommandResponse {
  return {
    status: "ok",
    message: [
      "Meal Logging Bot help",
      "",
      "Available commands:",
      "",
      "/help",
      "Show this help message.",
      "",
      "/addInventory item_name=\"red lentils\" quantity=500 unit=g location=cupboard",
      "Add an item to inventory. Not fully implemented yet.",
      "",
      "/logMeal meal_type=lunch items_text=\"rice, broccoli, seitan\" quantity_text=\"1 bowl\" energy_kcal=550",
      "Log a meal. Not fully implemented yet.",
      "",
      "/addProduct product_name=\"Greek yoghurt\" brand=\"Fage\" category=dairy",
      "Add a product to the catalogue. Preview flow coming later.",
      "",
      "/closeDay",
      "Close out the day. Preview flow coming later.",
      "",
      "/inventory",
      "List inventory. Coming later.",
      "",
      "/useSoon",
      "List items to use soon. Coming later.",
      "",
      "/gptToday",
      "Return today's context for Meal Planner GPT. Coming later.",
      "",
      "/gptPlanContext",
      "Return planning context for Meal Planner GPT. Coming later.",
    ].join("\n"),
  };
}