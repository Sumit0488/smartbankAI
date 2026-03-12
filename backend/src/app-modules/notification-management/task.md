# Task Checklist — Complete GraphQL Schema

## Phase 1 — Fix Shared Type Duplicates
- [/] Create src/shared/shared.graphql
- [ ] Fix user.graphql — remove DeleteResult
- [ ] Fix bank.graphql — remove DeleteResult, SeedResult
- [ ] Fix card.graphql — remove DeleteResult, SeedResult
- [ ] Fix expense.graphql — remove DeleteResult
- [ ] Fix loan.graphql — remove DeleteResult
- [ ] Fix investment.graphql — remove DeleteResult
- [ ] Fix forextransfer.graphql — remove DeleteResult
- [ ] Update server.js glob to include shared/*.graphql

## Phase 2 — Notification Module
- [ ] notification.graphql
- [ ] notification.service.js (Nodemailer)
- [ ] notification.resolver.js

## Phase 3 — Advisor Module
- [ ] advisor.graphql
- [ ] advisor.service.js
- [ ] advisor.resolver.js

## Phase 4 — Expense: Transaction History
- [ ] Add getTransactionHistory to expense.graphql
- [ ] Add getTransactionHistory to expense.service.js
- [ ] Add getTransactionHistory to expense.resolver.js

## Phase 5 — Verification
- [ ] npm run dev — no schema errors
- [ ] Test queries in GraphQL playground
