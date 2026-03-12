# investment-management Module

> Auto-generated documentation from `codegen/schemas/investment.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: Investment

Collection: `investments`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `investment_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `user_id` | String | ✅ | ❌ | Reference to the owning user |
| `investment_type` | String | ✅ | ❌ | Type of investment |
| `amount` | Number | ✅ | ❌ | Invested amount in INR |
| `expected_return` | Number | ❌ | ❌ | Expected annual return percentage |
| `current_value` | Number | ❌ | ❌ | Current market value of investment |
| `status` | String | ❌ | ❌ | Investment status |
| `invested_at` | Date | ❌ | ❌ | Date investment was made |
| `notes` | String | ❌ | ❌ | Optional notes |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getMyInvestments`** (USER) — Get all investments of the logged-in user
- **`getInvestmentsByType`** (USER) — Filter investments by type
- **`getPortfolioSummary`** (USER) — Aggregated portfolio stats for the current user
- **`getAllInvestments`** (ADMIN) — Admin — list all investments

### Mutations
- **`addInvestment`** (USER) — Add a new investment record
- **`updateInvestment`** (USER) — Update an investment
- **`deleteInvestment`** (USER) — Delete an investment record

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete |
| `USER` | create:own, read:own, update:own, delete:own |

## Events



## Generated Files

| File | Purpose |
|------|---------|
| `investment.model.js` | Mongoose schema + model |
| `investment.validation.js` | Joi input validation |
| `investment.service.js` | Business logic |
| `investment.resolver.js` | GraphQL resolvers |
| `investment.graphql` | GraphQL type definitions |
| `investment.test.js` | Jest unit tests |
