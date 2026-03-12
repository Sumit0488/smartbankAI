# card-management Module

> Auto-generated documentation from `codegen/schemas/card.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: Card

Collection: `cards`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `card_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `bank_name` | String | ✅ | ❌ | Issuing bank name |
| `card_name` | String | ✅ | ❌ | Card product name (e.g. HDFC Regalia) |
| `card_type` | String | ❌ | ❌ | Type of card |
| `annual_fee` | Number | ❌ | ❌ | Annual fee in INR (0 = lifetime free) |
| `joining_fee` | Number | ❌ | ❌ | One-time joining fee in INR |
| `cashback_rate` | Number | ❌ | ❌ | Cashback or reward rate percentage |
| `benefits` | String | ❌ | ❌ | Comma-separated benefits list (e.g. Lounge Access, Fuel Surcharge Waiver) |
| `card_category` | String | ❌ | ❌ | Primary use category for AI card recommendations |
| `rating` | Number | ❌ | ❌ | Card rating out of 5 |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getAllCards`** (PUBLIC) — List all cards
- **`getCardById`** (PUBLIC) — 
- **`getCardsByBank`** (PUBLIC) — Get all cards from a specific bank
- **`getCardsByType`** (PUBLIC) — Filter cards by credit/debit/prepaid
- **`getCardsByCategory`** (PUBLIC) — Filter cards by category for AI advisor
- **`searchCards`** (PUBLIC) — Search by card name or bank name

### Mutations
- **`createCard`** (ADMIN) — 
- **`updateCard`** (ADMIN) — 
- **`deleteCard`** (ADMIN) — 
- **`seedCards`** (ADMIN) — Seed default Indian bank cards

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete |
| `USER` | read |

## Events



## Generated Files

| File | Purpose |
|------|---------|
| `card.model.js` | Mongoose schema + model |
| `card.validation.js` | Joi input validation |
| `card.service.js` | Business logic |
| `card.resolver.js` | GraphQL resolvers |
| `card.graphql` | GraphQL type definitions |
| `card.test.js` | Jest unit tests |
