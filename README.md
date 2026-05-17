# Meal Logging Bot

### TL;DR

Meal Logging Bot is a personal meal logging service with a Telegram input interface, a Node.js + TypeScript backend deployed serverlessly on Vercel, and Google Sheets acting as a structured data store.

It supports quick phone-based logging for meals, inventory updates and product information, then returns structured summaries that can be used with a private custom Meal Planner GPT.

I built this as a learning-first project using ChatGPT and Codex to experiment with how AI tools can support real product development. I used ChatGPT as a planning and pairing tool to explore architecture options, understand trade-offs, compare technologies, debug problems, and learn about new concepts.

This project is the first iteration of a developing personal food, nutrition, health planning and data evaluation system.

## Why I Built This

I originally created a private custom Meal Planner GPT to help with meal planning, nutrition reflection, calorie awareness and food shopping.

On its own, it helped reduce much of the cognitive load around food decisions. It supported recipe creation, estimating calories, reflecting on patterns, adjusting around energy and appetite, and making better food choices that fit my personal needs.

It worked really well as a reasoning and coaching tool, but I knew I could make the overall system work even better for me.

For better long-term analysis and planning, I wanted a way to record what I was eating, track daily context, support gradual, long term health goals, and manage a rapidly changing food inventory. I wanted that data to be structured, searchable, and easy to inspect, instead of scattered across chat history.

This project is my first attempt at building that missing layer.

The basic flow is:

```text
Telegram input
      ↓
Vercel-hosted TypeScript backend
      ↓
Google Apps Script bridge
      ↓
Google Sheets data store
      ↓
Structured summaries for GPT-assisted reflection
```

## What It Does

Meal Logging Bot supports a small set of focused workflows:

- log meals into a structured `FoodLog` sheet
- add and manage food inventory in an `Inventory` sheet
- add product information into a `ProductCatalogue` sheet
- close the day with useful context such as mood, energy, appetite and notes
- retrieve current inventory
- retrieve food that should be used soon
- generate structured summaries for GPT-assisted meal planning and reflection

The bot uses strict slash commands with `key=value` fields. This was an intentional decision. Strict commands are less flexible than natural language, but they are easier to validate, test and debug.

Example commands:

```text
/logMeal date=2026-04-24 meal_type=breakfast items_text="scrambled eggs with spinach and tomatoes" quantity_text="2 eggs + spinach + 1/2 tin tomatoes" energy_kcal=230 protein_g=16 fibre_g=5
```
```
/addInventory item_name="blueberries" quantity=300 unit=g location=fridge
```
```
/closeDay date=2026-04-24 mood=calm energy=medium appetite=normal notes="office day"
```

<img width="625" height="1279" alt="telegram-flow" src="https://github.com/user-attachments/assets/ffe7d872-0fb4-4a5c-aff8-550417d1f4a0" />

<img width="1412" height="100" alt="google-sheets-data" src="https://github.com/user-attachments/assets/48aee8ee-d0a3-4625-a26f-d421a4659cd0" />


## How This Fits With the Custom GPT

The Meal Planner GPT is a private custom GPT that acts as the planning and reasoning layer for this system.

It is set up to understand my meal planning preferences, nutrition goals, and logging format. When needed, it can turn a meal description into a bot-ready command using the strict `key=value` format expected by Meal Logging Bot.

For example, I can describe a meal naturally in ChatGPT, then ask for a Telegram-ready logging command. The GPT can estimate the useful fields, format the command, and keep the output compatible with the bot parser.

This keeps the responsibilities separate:

```text
Meal Planner GPT
Planning, reasoning, calorie estimation, reflection, command formatting

Meal Logging Bot
Capture, validation, storage, retrieval


tbc
