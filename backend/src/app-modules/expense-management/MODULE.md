# expense-management Module

> Auto-generated documentation from `codegen/schemas/expense.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: Expense

Collection: `expenses`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `expense_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `user_id` | String | ✅ | ❌ | Reference to the owning user |
| `category` | String | ❌ | ❌ | Expense category |
| `amount` | Number | ✅ | ❌ | Expense amount in INR |
| `month` | String | ❌ | ❌ | Month identifier in YYYY-MM format (e.g. 2026-03) |
| `description` | String | ❌ | ❌ | Optional expense description |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getMyExpenses`** (USER) — Get all expenses of the logged-in user
- **`getExpensesByMonth`** (USER) — Get expenses for a specific month
- **`getExpensesByCategory`** (USER) — Filter expenses by category
- **`getAllExpenses`** (ADMIN) — Admin — list all expenses across all users

### Mutations
- **`addExpense`** (USER) — Add a new expense record
- **`updateExpense`** (USER) — Update an existing expense
- **`deleteExpense`** (USER) — Delete an expense record

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete |
| `USER` | create:own, read:own, update:own, delete:own |

## Events

- **`addExpense`** → emits `ExpenseAdded` + sends email notification

## Generated Files

| File | Purpose |
|------|---------|
| `expense.model.js` | Mongoose schema + model |
| `expense.validation.js` | Joi input validation |
| `expense.service.js` | Business logic |
| `expense.resolver.js` | GraphQL resolvers |
| `expense.graphql` | GraphQL type definitions |
| `expense.test.js` | Jest unit tests |
