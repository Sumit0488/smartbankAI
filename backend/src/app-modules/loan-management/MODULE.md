# loan-management Module

> Auto-generated documentation from `codegen/schemas/loan.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: Loan

Collection: `loans`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `loan_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `user_id` | String | ✅ | ❌ | Reference to the owning user |
| `loan_type` | String | ✅ | ❌ | Type of loan |
| `loan_amount` | Number | ✅ | ❌ | Principal loan amount in INR |
| `interest_rate` | Number | ✅ | ❌ | Annual interest rate in percentage |
| `tenure` | Number | ✅ | ❌ | Loan tenure in months |
| `emi` | Number | ❌ | ❌ | Calculated EMI (auto-computed from amount, rate, tenure) |
| `total_payable` | Number | ❌ | ❌ | Total amount payable (emi × tenure) |
| `total_interest` | Number | ❌ | ❌ | Total interest payable |
| `status` | String | ❌ | ❌ | Loan application status |
| `bank_name` | String | ❌ | ❌ | Preferred bank for the loan |
| `applied_at` | Date | ❌ | ❌ | Date of application |
| `notes` | String | ❌ | ❌ |  |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getMyLoans`** (USER) — Get all loan applications of the logged-in user
- **`getLoansByStatus`** (USER) — Filter loans by status
- **`getLoanEMI`** (USER) — Calculate EMI without saving a loan record
- **`getAllLoans`** (ADMIN) — Admin — list all loan applications

### Mutations
- **`applyLoan`** (USER) — Apply for a new loan
- **`updateLoan`** (USER) — Update a loan application
- **`updateLoanStatus`** (ADMIN) — Admin — approve/reject/disburse a loan
- **`deleteLoan`** (USER) — Withdraw a pending loan application

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete, manage_status |
| `USER` | create:own, read:own, update:own, delete:own |

## Events

- **`applyLoan`** → emits `LoanApplied` + sends email notification

## Generated Files

| File | Purpose |
|------|---------|
| `loan.model.js` | Mongoose schema + model |
| `loan.validation.js` | Joi input validation |
| `loan.service.js` | Business logic |
| `loan.resolver.js` | GraphQL resolvers |
| `loan.graphql` | GraphQL type definitions |
| `loan.test.js` | Jest unit tests |
