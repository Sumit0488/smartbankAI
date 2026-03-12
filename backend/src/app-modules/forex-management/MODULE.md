# forex-management Module

> Auto-generated documentation from `codegen/schemas/forex.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: ForexTransfer

Collection: `forex_transfers`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `transfer_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `user_id` | String | ✅ | ❌ | Reference to the owning user |
| `amount` | Number | ✅ | ❌ | Source amount to convert |
| `from_currency` | String | ✅ | ❌ | Source currency ISO code (e.g. INR) |
| `to_currency` | String | ✅ | ❌ | Target currency ISO code (e.g. USD) |
| `exchange_rate` | Number | ✅ | ❌ | Effective exchange rate at time of transfer |
| `converted_amount` | Number | ❌ | ❌ | Auto-computed result (amount × exchange_rate) |
| `status` | String | ❌ | ❌ | Transfer lifecycle status |
| `transferred_at` | Date | ❌ | ❌ | Timestamp of transfer initiation |
| `notes` | String | ❌ | ❌ |  |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getMyTransfers`** (USER) — Get all forex transfers of the logged-in user
- **`getTransfersByStatus`** (USER) — Filter transfers by status
- **`getLiveRate`** (USER) — Fetch real-time exchange rate (no DB write)
- **`getAllTransfers`** (ADMIN) — Admin — list all forex transfers

### Mutations
- **`initiateTransfer`** (USER) — Initiate a new forex transfer
- **`cancelTransfer`** (USER) — Cancel an initiated transfer
- **`updateTransferStatus`** (ADMIN) — Admin — mark transfer completed/failed

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete, manage_status |
| `USER` | create:own, read:own, delete:own |

## Events

- **`initiateTransfer`** → emits `ForexTransferCompleted` + sends email notification

## Generated Files

| File | Purpose |
|------|---------|
| `forextransfer.model.js` | Mongoose schema + model |
| `forextransfer.validation.js` | Joi input validation |
| `forextransfer.service.js` | Business logic |
| `forextransfer.resolver.js` | GraphQL resolvers |
| `forextransfer.graphql` | GraphQL type definitions |
| `forextransfer.test.js` | Jest unit tests |
