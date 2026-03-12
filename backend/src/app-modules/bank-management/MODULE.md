# bank-management Module

> Auto-generated documentation from `codegen/schemas/bank.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: Bank

Collection: `banks`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `bank_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `bank_name` | String | ✅ | ✅ | Official bank name |
| `minimum_balance` | Number | ❌ | ❌ | Minimum account balance required in INR |
| `interest_rate` | Number | ❌ | ❌ | Savings account interest rate (% p.a.) |
| `forex_fee` | Number | ❌ | ❌ | Forex transaction fee (%) |
| `account_types` | String | ❌ | ❌ | Comma-separated account types (e.g. Savings,Current,Salary) |
| `features` | String | ❌ | ❌ | Comma-separated feature list (e.g. Zero Balance, Net Banking, UPI) |
| `rating` | Number | ❌ | ❌ | Bank rating out of 5 |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getAllBanks`** (PUBLIC) — List all banks (public — no auth required)
- **`getBankById`** (PUBLIC) — Get a specific bank by ID
- **`searchBanks`** (PUBLIC) — Search banks by name
- **`compareBanks`** (PUBLIC) — Compare two or more banks side by side

### Mutations
- **`createBank`** (ADMIN) — Admin — add a new bank
- **`updateBank`** (ADMIN) — Admin — update bank details
- **`deleteBank`** (ADMIN) — Admin — remove a bank

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete |
| `USER` | read |

## Events



## Generated Files

| File | Purpose |
|------|---------|
| `bank.model.js` | Mongoose schema + model |
| `bank.validation.js` | Joi input validation |
| `bank.service.js` | Business logic |
| `bank.resolver.js` | GraphQL resolvers |
| `bank.graphql` | GraphQL type definitions |
| `bank.test.js` | Jest unit tests |
