# Meal Logging Bot MVP

Meal Logging Bot is the capture, persistence, and retrieval layer for a Meal Planner Automation MVP.

Telegram is the user interface.
Google Sheets is the MVP source of truth.
Meal Planner GPT remains the planning and reasoning layer.

## MVP Scope

Implemented:
- Telegram webhook handling with allowed-user restriction
- Command parsing with strict `key=value` payloads
- Inventory capture with `/addInventory`
- Meal capture with `/logMeal`
- Product preview flow with `/addProduct`, `/confirm`, `/cancel`
- Close-day preview flow with `/closeDay`, `/confirm`, `/cancel`
- Read-only retrieval commands: `/inventory`, `/useSoon`, `/gptToday`, `/gptPlanContext`

Non-goals for this MVP:
- Rich Telegram UI widgets or keyboards
- Multi-user collaboration
- Persistent preview state across deploys
- Advanced natural-language parsing
- Automated nutrition reasoning inside the bot

## Architecture Overview

- Telegram webhook receives messages and applies sender restrictions.
- The command router parses strict slash commands and returns transport-agnostic `CommandResponse` objects.
- Handlers validate fields, call repository helpers, and return deterministic plain-text results.
- Telegram delivery happens only at the webhook boundary via `sendMessage`.
- Google Sheets repositories read and write the source-of-truth tabs.

## Local Development

Prerequisites:
- Node.js 20+
- npm
- A Telegram bot token
- A Google Sheet with the expected tabs
- A Google service account with access to that spreadsheet

Install:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Environment Variables

Required at startup:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_ID`

Optional:
- `PORT`
- `DEBUG_ROUTES_ENABLED`

Required for Google Sheets access:
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Optional local fallback for Google auth:
- `GOOGLE_APPLICATION_CREDENTIALS`

`DEBUG_ROUTES_ENABLED=true` enables temporary local/debug routes. Keep it unset or `false` in production.

## Google Sheets Tabs

Expected tabs:
- `Inventory`
- `FoodLog`
- `DailyNotes`
- `ProductCatalogue`

Other tabs may exist for future work, but the MVP command flow currently depends on the tabs above.

The row headers should match the repository field names already used by the app.

## Command Format

Commands use strict slash-command syntax with `key=value` fields.

Rules:
- Multi-word values must be wrapped in double quotes
- Unknown fields are rejected
- Field names are case-sensitive
- Command names are slash-prefixed

Examples:

```text
/help
/addInventory item_name="red lentils" quantity=500 unit=g location=cupboard
/logMeal date=2026-04-23 meal_type=lunch items_text="rice, broccoli, seitan" quantity_text="1 bowl" energy_kcal=550
/addProduct product_name="Greek yoghurt" brand="Fage" category=dairy
/closeDay date=2026-04-23 mood=calm energy=medium appetite=normal notes="steady day"
/confirm
/cancel
/inventory
/useSoon
/gptToday
/gptToday date=2026-04-23
/gptPlanContext
```

## Implemented Command Summary

`/addInventory`
- Writes immediately to `Inventory`

`/logMeal`
- Writes immediately to `FoodLog`

`/addProduct`
- Creates a pending preview
- `/confirm` writes to `ProductCatalogue`
- `/cancel` discards the preview

`/closeDay`
- Creates a pending preview
- `/confirm` writes to `DailyNotes`
- `/cancel` discards the preview

`/inventory`
- Lists active inventory rows

`/useSoon`
- Lists active dated inventory rows sorted by earliest date

`/gptToday`
- Returns a compact today-focused GPT handoff

`/gptPlanContext`
- Returns a broader planning handoff

## Security Notes

- Do not commit real `.env` values
- Do not commit service-account credentials
- Restrict Telegram access with `TELEGRAM_ALLOWED_USER_ID`
- Keep `DEBUG_ROUTES_ENABLED` off in production
- Logs should avoid secrets and full sensitive payloads

## Future Improvements

- Persist preview state outside process memory
- Add richer inventory status handling
- Add structured date validation
- Add pagination or chunking for longer retrieval responses
- Add admin auth around debug tooling if retained
- Add integration tests against a dedicated test spreadsheet
