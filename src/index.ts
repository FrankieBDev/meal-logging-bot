import express from "express";
import { routeCommandText } from "./commands/commandRouter.js";
import { env } from "./config/env.js";
import { errorHandler } from "./errors/errorHandler.js";
import { logger } from "./logger.js";
import { createSheetsClient, getSpreadsheetId } from "./sheets/sheetsClient.js";
import { appendProductCatalogueItem } from "./sheets/productCatalogueRepository.js";
import { appendInventoryItem } from "./sheets/inventoryRepository.js";
import { appendFoodLogItem } from "./sheets/foodLogRepository.js";
import { appendInventoryEvent } from "./sheets/inventoryEventsRepository.js";
import { appendDailyNote } from "./sheets/dailyNotesRepository.js";
import { appendDailyNutritionSummary } from "./sheets/dailyNutritionSummaryRepository.js";
import { processTelegramWebhook } from "./telegram/webhook.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  logger.info("Health check requested");

  res.json({
    status: "ok",
  });
});

app.get("/test-error", () => {
  throw new Error("Test error");
});

app.post("/telegram/webhook", async (req, res, next) => {
  try {
    const result = await processTelegramWebhook(req.body);

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    next(error);
  }
});

app.get("/debug/sheets-title", async (_req, res, next) => {
  try {
    const sheets = await createSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId: getSpreadsheetId(),
    });

    res.json({
      status: "ok",
      title: response.data.properties?.title,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/debug/product-catalogue-test", async (_req, res, next) => {
  try {
    await appendProductCatalogueItem({
      productId: `debug_product_${Date.now()}`,
      productName: "Debug Greek Yoghurt",
      brand: "Debug Brand",
      shop: "Test Shop",
      category: "dairy",
      subcategory: "yoghurt",
      packetSizeQuantity: 500,
      packetSizeUnit: "g",
      servingSizeQuantity: 100,
      servingSizeUnit: "g",
      servingsPerPack: 5,
      nutritionBasis: "per_100g",
      energyKjPer100g: 400,
      energyKcalPer100g: 95,
      fatGPer100g: 3.2,
      saturatesGPer100g: 2.1,
      carbsGPer100g: 4.5,
      sugarsGPer100g: 4.5,
      fibreGPer100g: 0,
      proteinGPer100g: 10,
      saltGPer100g: 0.12,
      source: "debug_route",
      confidence: 1,
      isRegularBuy: false,
      notes: "Temporary test row. Safe to delete.",
    });

    res.json({
      status: "ok",
      message: "Debug product row appended",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/debug/repositories-test", async (_req, res, next) => {
  try {
    const timestamp = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    await appendInventoryItem({
      inventory_id: `debug_inventory_${timestamp}`,
      product_id: `debug_product_${timestamp}`,
      item_name: "Debug Eggs",
      category: "protein",
      quantity: 6,
      unit: "items",
      quantity_description: "6 eggs",
      location: "fridge",
      status: "available",
      is_staple: false,
      priority: "normal",
      source: "debug_route",
      confidence: 1,
      notes: "Temporary debug inventory row. Safe to delete.",
    });

    await appendFoodLogItem({
      food_log_id: `debug_food_${timestamp}`,
      date: today,
      time: "12:00",
      meal_type: "lunch",
      status: "logged",
      items_text: "Debug Greek yoghurt",
      product_links_json: "[]",
      quantity_text: "100g",
      energy_kcal: 95,
      energy_kj: 400,
      protein_g: 10,
      carbs_g: 4.5,
      sugars_g: 4.5,
      fat_g: 3.2,
      saturates_g: 2.1,
      fibre_g: 0,
      salt_g: 0.12,
      extra_nutrients_json: "{}",
      calculation_method: "debug_manual",
      confidence: 1,
      notes: "Temporary debug food log row. Safe to delete.",
      source: "debug_route",
    });

    await appendInventoryEvent({
      event_id: `debug_event_${timestamp}`,
      date: today,
      time: "12:00",
      event_type: "add",
      inventory_id: `debug_inventory_${timestamp}`,
      product_id: `debug_product_${timestamp}`,
      item_name: "Debug Eggs",
      quantity_change: 6,
      unit: "items",
      previous_quantity: 0,
      new_quantity: 6,
      location: "fridge",
      reason: "debug_test",
      source: "debug_route",
      confidence: 1,
      warning: "",
      notes: "Temporary debug inventory event row. Safe to delete.",
    });

    await appendDailyNutritionSummary({
      date: today,
      energy_kcal_total: 95,
      energy_kj_total: 400,
      protein_g_total: 10,
      carbs_g_total: 4.5,
      sugars_g_total: 4.5,
      fat_g_total: 3.2,
      saturates_g_total: 2.1,
      fibre_g_total: 0,
      salt_g_total: 0.12,
      extra_nutrients_json: "{}",
      completeness: "debug_partial",
      confidence: 1,
      calculation_method: "debug_manual",
      notes: "Temporary debug daily nutrition summary row. Safe to delete.",
      source: "debug_route",
    });

    await appendDailyNote({
      daily_note_id: `debug_note_${timestamp}`,
      date: today,
      energy: "medium",
      hunger: "normal",
      cravings: "none",
      mood: "debug",
      sleep: "not logged",
      exercise: "debug walk",
      steps: 1234,
      cycle_context: "not logged",
      office_day: false,
      capacity: "normal",
      notes: "Temporary debug daily note row. Safe to delete.",
      source: "debug_route",
      confidence: 1,
    });

    res.json({
      status: "ok",
      message:
        "Debug rows appended to Inventory, FoodLog, InventoryEvents, DailyNutritionSummary, and DailyNotes",
    });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(env.port, () => {
  logger.info("Meal Logging Bot backend is alive.");
  logger.info(`Listening on port ${env.port}`);
});
