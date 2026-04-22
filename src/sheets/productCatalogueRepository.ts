import { createSheetsClient, getSpreadsheetId } from "./sheetsClient.js";

export type NutritionBasis = "per_100g" | "per_100ml";

type SheetCellValue = string | number | boolean;

export type ProductCatalogueItem = {
  productId: string;
  productName: string;

  brand?: string;
  shop?: string;
  category?: string;
  subcategory?: string;

  packetSizeQuantity?: number;
  packetSizeUnit?: string;

  servingSizeQuantity?: number;
  servingSizeUnit?: string;
  servingsPerPack?: number;

  unitName?: string;
  unitWeightG?: number;

  nutritionBasis?: NutritionBasis;

  energyKjPer100g?: number;
  energyKcalPer100g?: number;
  fatGPer100g?: number;
  saturatesGPer100g?: number;
  carbsGPer100g?: number;
  sugarsGPer100g?: number;
  fibreGPer100g?: number;
  proteinGPer100g?: number;
  saltGPer100g?: number;

  sodiumMgPer100g?: number;
  ironMgPer100g?: number;
  calciumMgPer100g?: number;
  magnesiumMgPer100g?: number;
  potassiumMgPer100g?: number;
  zincMgPer100g?: number;
  iodineUgPer100g?: number;
  vitaminB12UgPer100g?: number;
  vitaminDUgPer100g?: number;
  folateUgPer100g?: number;
  omega3GPer100g?: number;

  nutritionPerServingJson?: string;
  nutritionPerPackJson?: string;
  extraNutrientsJson?: string;

  ingredients?: string;
  allergens?: string;
  storageInstructions?: string;
  cookingInstructions?: string;

  openedUseWithinDays?: number;
  source?: string;
  confidence?: number;
  isRegularBuy?: boolean;
  notes?: string;

  createdAt?: string;
  updatedAt?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function valueOrBlank(
  value: SheetCellValue | undefined,
): SheetCellValue | "" {
  return value ?? "";
}

export async function appendProductCatalogueItem(
  product: ProductCatalogueItem,
): Promise<void> {
  const sheets = await createSheetsClient();
  const timestamp = nowIso();

  const row = [
    product.productId,
    product.productName,
    valueOrBlank(product.brand),
    valueOrBlank(product.shop),
    valueOrBlank(product.category),
    valueOrBlank(product.subcategory),
    valueOrBlank(product.packetSizeQuantity),
    valueOrBlank(product.packetSizeUnit),
    valueOrBlank(product.servingSizeQuantity),
    valueOrBlank(product.servingSizeUnit),
    valueOrBlank(product.servingsPerPack),
    valueOrBlank(product.unitName),
    valueOrBlank(product.unitWeightG),
    valueOrBlank(product.nutritionBasis),
    valueOrBlank(product.energyKjPer100g),
    valueOrBlank(product.energyKcalPer100g),
    valueOrBlank(product.fatGPer100g),
    valueOrBlank(product.saturatesGPer100g),
    valueOrBlank(product.carbsGPer100g),
    valueOrBlank(product.sugarsGPer100g),
    valueOrBlank(product.fibreGPer100g),
    valueOrBlank(product.proteinGPer100g),
    valueOrBlank(product.saltGPer100g),
    valueOrBlank(product.sodiumMgPer100g),
    valueOrBlank(product.ironMgPer100g),
    valueOrBlank(product.calciumMgPer100g),
    valueOrBlank(product.magnesiumMgPer100g),
    valueOrBlank(product.potassiumMgPer100g),
    valueOrBlank(product.zincMgPer100g),
    valueOrBlank(product.iodineUgPer100g),
    valueOrBlank(product.vitaminB12UgPer100g),
    valueOrBlank(product.vitaminDUgPer100g),
    valueOrBlank(product.folateUgPer100g),
    valueOrBlank(product.omega3GPer100g),
    valueOrBlank(product.nutritionPerServingJson),
    valueOrBlank(product.nutritionPerPackJson),
    valueOrBlank(product.extraNutrientsJson),
    valueOrBlank(product.ingredients),
    valueOrBlank(product.allergens),
    valueOrBlank(product.storageInstructions),
    valueOrBlank(product.cookingInstructions),
    valueOrBlank(product.openedUseWithinDays),
    valueOrBlank(product.source),
    valueOrBlank(product.confidence),
    valueOrBlank(product.isRegularBuy),
    valueOrBlank(product.notes),
    product.createdAt ?? timestamp,
    product.updatedAt ?? timestamp,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "ProductCatalogue!A:AV",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
}