# SmartBankAI Backend — Architecture

## System Overview

SmartBankAI is a fully serverless fintech backend deployed on AWS, using a GraphQL API exposed through AppSync, business logic in Lambda functions, MongoDB Atlas as the database, and Cognito for identity management.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend                               │
│                    (Apollo Client + Amplify)                         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ GraphQL over HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS AppSync                                      │
│             (GraphQL API — Cognito Auth + API Key)                   │
│  Resolvers: User | Admin | Loan | Investment                         │
└──────────┬──────────────────────────────────┬───────────────────────┘
           │ Lambda Invoke                    │
    ┌──────▼────────┐  ┌──────────────┐  ┌───▼───────────────┐
    │ UserHandler   │  │ LoanHandler  │  │ InvestmentHandler │
    │ Lambda        │  │ Lambda       │  │ Lambda            │
    └──────┬────────┘  └──────┬───────┘  └───────┬───────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │ All Lambdas use:
                  ┌───────────┼──────────────────────┐
                  │           │                      │
           ┌──────▼──┐  ┌─────▼──────┐  ┌───────────▼──┐
           │ MongoDB │  │ EventBridge│  │ SES + SNS    │
           │  Atlas  │  │  (Events)  │  │ (Email + SMS)│
           └─────────┘  └─────┬──────┘  └──────────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
        ┌──────▼──┐   ┌───────▼─┐   ┌───────▼──┐
        │ User    │   │ Loan    │   │Investment│
        │ Lambda  │   │ Lambda  │   │ Lambda   │
        │(async)  │   │(async)  │   │(async)   │
        └─────────┘   └─────────┘   └──────────┘
```

## AWS Services

| Service | Purpose |
|---|---|
| **AppSync** | GraphQL API gateway — auth, schema, resolvers |
| **Lambda** | Serverless compute for all business logic |
| **Cognito** | User authentication, JWT tokens, user pools |
| **MongoDB Atlas** | Primary database (users, loans, investments) |
| **SES** | Transactional email delivery |
| **SNS** | SMS delivery + topic-based pub/sub |
| **EventBridge** | Asynchronous domain event routing |
| **SQS** | Reliable async message queuing with DLQ |
| **S3** | File storage (KYC docs, loan docs, user files) |
| **CloudFormation** | Infrastructure as Code deployment |
| **CloudWatch** | Logs, metrics, alarms |
| **SSM Parameter Store** | Deployment version tracking for rollback |

## Authentication Flow

```
1. User → POST /login (Cognito Hosted UI or SDK)
2. Cognito → Returns JWT (AccessToken + IdToken + RefreshToken)
3. Frontend → GraphQL request with Authorization: Bearer <IdToken>
4. AppSync → Validates JWT against Cognito JWKS
5. AppSync → Passes identity (sub, email, role) to Lambda via event.identity
6. Lambda → core/auth/extractIdentity() reads role from identity
7. Lambda → Enforces RBAC (USER vs ADMIN)
```

## Event Flow

```
User Action (e.g. Approve Loan)
  └→ Lambda approveLoan.js
       ├→ Update MongoDB (status: APPROVED)
       ├→ publishLoanApprovedEvent() → EventBridge
       │    └→ LoanApprovedRule → LoanHandler Lambda (async)
       │    └→ LoanApprovedRule → SNS Topic (broadcast)
       └→ sendLoanApprovedNotification() → SES email + SNS SMS
```

## Core Module Layer

All Lambda functions import from `core/` — never directly from AWS SDK or Mongoose:

```
core/
├── auth/        JWT verification, requireAuth(), requireAdmin()
├── db/          MongoDB singleton, connectDB(), getDB()
├── logger/      Structured JSON logs → CloudWatch
├── errorHandler/ AppError, ValidationError, AuthError, NotFoundError
├── validation/  Joi schemas, validateCreateUser(), validateApplyLoan()
├── response/    paginatedResponse(), successResponse(), deleteResponse()
├── notification/ sendWelcomeEmail(), sendLoanApprovedNotification()
└── events/      publishUserCreatedEvent(), publishLoanApprovedEvent()
```

## Database Design

**Collection: users**
- userId (UUID), name, email, password (bcrypt), phone, role, salary, profileType, isEmailVerified, status, timestamps

**Collection: loans**
- loanId, userId, loanType, loanAmount, interestRate, tenure, emi, totalPayable, totalInterest, status, bankName, appliedAt, notes, rejectionReason, timestamps

**Collection: investments**
- investmentId, userId, investmentType, amount, expectedReturn, currentValue, status, investedAt, notes, timestamps

## Security Considerations

- All S3 buckets block public access; access only via presigned URLs or Lambda role
- All data encrypted at rest (S3: AES256, MongoDB: Atlas encryption at rest)
- All data in transit over HTTPS/TLS
- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens validated against Cognito JWKS on every request
- Lambda least-privilege IAM policy — no wildcard resource for sensitive services
- Sensitive env vars stored in SSM Parameter Store (not hardcoded)
- SQS DLQ alerts via CloudWatch when messages pile up
- Cognito advanced security mode: ENFORCED

## Deployment Architecture

```
GitHub Push → CI/CD Pipeline
  1. Validate schema
  2. Run tests
  3. Build Lambda ZIP
  4. Upload to S3
  5. Save version to SSM
  6. aws cloudformation deploy (master.yaml)
     ├── cognito.yaml    (Cognito User Pool)
     ├── ses-sns.yaml    (SNS Topics + SQS)
     ├── lambda.yaml     (IAM Role + Functions)
     ├── s3.yaml         (Storage Buckets)
     ├── eventbridge.yaml(Event Bus + Rules)
     └── appsync.yaml    (GraphQL API + Resolvers)
  7. On failure → rollback.sh (redeploy prev version from SSM)
```
