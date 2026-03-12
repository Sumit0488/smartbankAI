# SmartBankAI Backend v2.0

Production-ready, fully serverless fintech backend on AWS.

```
React Frontend
      │ GraphQL (HTTPS)
      ▼
AWS AppSync ──── AWS Cognito (Auth)
      │
      ▼ Lambda Invoke
┌─────┬──────┬────────────┐
│User │Loan  │Investment  │  ← Lambda Functions
└──┬──┴──┬───┴──────┬─────┘
   │     │          │
   ▼     ▼          ▼
MongoDB  EventBridge  SES + SNS
Atlas    (Events)     (Email + SMS)
```

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Server | Express.js |
| API | Apollo GraphQL |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Joi |
| Notifications | Nodemailer + Gmail SMTP |
| Tests | Jest + mongodb-memory-server |

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
# Edit .env — add Gmail App Password and verify MongoDB URI

# 3. Generate user-management module from schema
npm run generate -- codegen/schemas/user.schema.yaml

# 4. Merge GraphQL schemas (optional — server auto-loads)
npm run merge-graphql

# 5. Start development server
npm run dev

# 6. Run tests
npm test
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET  /health` | Server health check |
| `POST /graphql` | All GraphQL queries & mutations |

## Codegen

Any new module is generated from a YAML schema:

```bash
npm run generate -- codegen/schemas/{entity}.schema.yaml
```

**Generates 7 files per module:**

```
src/app-modules/{module}/
  ├── {entity}.model.js       ← Mongoose model
  ├── {entity}.validation.js  ← Joi validation
  ├── {entity}.service.js     ← Business logic
  ├── {entity}.resolver.js    ← GraphQL resolvers
  ├── {entity}.graphql        ← GraphQL type defs
  ├── {entity}.test.js        ← Jest tests
  └── MODULE.md               ← Auto documentation
```

## GraphQL Examples

### Register User
```graphql
mutation {
  registerUser(input: {
    name: "Sumit Kumar"
    email: "sumit@example.com"
    password: "SecurePass123"
    salary: 75000
    profileType: "Working Professional"
  }) {
    token
    user { _id name email role }
  }
}
```

### Login
```graphql
mutation {
  loginUser(email: "sumit@example.com", password: "SecurePass123") {
    token
    user { _id name email role }
  }
}
```

### Get Profile (requires Authorization header)
```graphql
query {
  getProfile {
    _id name email role salary profileType createdAt
  }
}
```

## Notification Events

| Event | Trigger | Email Sent |
|-------|---------|-----------|
| `UserRegistered` | Register mutation | Welcome email |
| `LoanApplied` | Loan module | Loan alert |
| `ExpenseAdded` | Expense module | Expense alert |
| `ForexTransferCompleted` | Forex module | Transfer confirmation |

## Modules Planned

- [x] user-management
- [ ] expense-management
- [ ] investment-management
- [ ] loan-management
- [ ] bank-management
- [ ] card-management
- [ ] forex-management
