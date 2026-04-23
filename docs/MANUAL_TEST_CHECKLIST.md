# Manual Test Checklist

## Setup

- Deploy the latest build
- Confirm production env vars are set
- Confirm `DEBUG_ROUTES_ENABLED` is off in production
- Confirm the Telegram webhook is active

## Auth And Webhook Basics

- Authorised user sends `/help` and receives a Telegram reply
- Unauthorised user sends `/help` and receives no useful app action; webhook returns `unauthorised_user`
- Send a webhook payload without `message.from.id` and confirm `missing_sender_id`
- Send a webhook payload without `message.text` and confirm `missing_message_text`

## Malformed Commands

- Send plain text without a slash and confirm `Message must start with a slash command.`
- Send an unknown command such as `/dance` and confirm `Unsupported command: /dance`
- Send an unquoted multi-word value such as `/addInventory item_name=red lentils quantity=500 unit=g`
- Confirm the bot says multi-word values must be wrapped in quotes
- Send a known command with an unknown field such as `/logMeal date=2026-04-23 meal_type=lunch items_text="rice bowl" extra=yes`
- Confirm the bot rejects the unknown field deterministically

## Valid Capture Commands

- `/addInventory item_name="red lentils" quantity=500 unit=g location=cupboard`
- Confirm Telegram reply is success
- Confirm a new `Inventory` row is written

- `/logMeal date=2026-04-23 meal_type=lunch items_text="rice bowl" quantity_text="1 bowl" energy_kcal=550`
- Confirm Telegram reply is success
- Confirm a new `FoodLog` row is written

## Preview / Confirm / Cancel

- `/addProduct product_name="Greek yoghurt" brand="Fage" category=dairy`
- Confirm preview appears and no sheet write happens yet
- `/cancel`
- Confirm preview is cancelled

- Run `/addProduct ...` again
- `/confirm`
- Confirm a `ProductCatalogue` row is written

- `/closeDay date=2026-04-23 mood=calm energy=medium appetite=normal notes="steady day"`
- Confirm preview appears and no sheet write happens yet
- `/cancel`
- Confirm preview is cancelled

- Run `/closeDay ...` again
- `/confirm`
- Confirm a `DailyNotes` row is written

- `/confirm` with no pending preview
- Confirm the app returns the no-pending-preview message

## Read-Only Commands

- `/inventory`
- Confirm active inventory rows are listed compactly

- `/useSoon`
- Confirm dated active items are listed earliest first

- `/gptToday`
- Confirm the response contains today-focused meal and daily-note context

- `/gptToday date=2026-04-23`
- Confirm the requested date is used

- `/gptPlanContext`
- Confirm the response includes recent meals, inventory, and recent daily notes

## Deployment / Safety Checks

- Confirm `/health` responds normally
- Confirm `/test-error` is not available in production
- Confirm `/debug/...` routes are not available in production
- Confirm logs do not print Telegram bot tokens or service-account private keys
- Confirm the app still starts if Google env vars are temporarily removed, and `/help` still works

## Known Bugs / Rough Edges

- Preview state is in-memory only and is lost on restart or deploy
- Only one pending preview/action is stored per actor
- Multi-word values still require double quotes
- Retrieval formatting is intentionally compact, not exhaustive
- Date handling is intentionally simple and expects ISO-style strings
