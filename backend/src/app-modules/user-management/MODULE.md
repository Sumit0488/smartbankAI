# user-management Module

> Auto-generated documentation from `codegen/schemas/user.schema.yaml`
> **DO NOT EDIT MANUALLY** — regenerate from YAML schema.

## Entity: User

Collection: `users`

## Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `user_id` | String | ❌ | ✅ | External unique identifier (auto-generated UUID) |
| `name` | String | ✅ | ❌ | Full name of the user |
| `email` | String | ✅ | ✅ | Email address — used for login and notifications |
| `password` | String | ✅ | ❌ | Hashed password (bcrypt) — never returned in queries |
| `role` | String | ❌ | ❌ | Access control role |
| `salary` | Number | ❌ | ❌ | Monthly salary in INR — used for loan eligibility |
| `profileType` | String | ❌ | ❌ | Financial profile type |
| `isEmailVerified` | Boolean | ❌ | ❌ |  |
| `createdAt` | Date | ❌ | ❌ |  |
| `updatedAt` | Date | ❌ | ❌ |  |

## Operations

### Queries
- **`getProfile`** (USER) — Get the currently logged-in user's profile
- **`getAllUsers`** (ADMIN) — List all users (admin only)
- **`getUserById`** (ADMIN) — 

### Mutations
- **`registerUser`** (PUBLIC) — Register a new user account
- **`loginUser`** (PUBLIC) — Login and receive a JWT token
- **`updateProfile`** (USER) — Update the authenticated user's profile
- **`deleteUser`** (ADMIN) — 

## Permissions

| Role | Allowed Operations |
|------|--------------------|
| `ADMIN` | create, read, update, delete |
| `USER` | read:own, update:own |

## Events

- **`registerUser`** → emits `UserRegistered` + sends email notification

## Generated Files

| File | Purpose |
|------|---------|
| `user.model.js` | Mongoose schema + model |
| `user.validation.js` | Joi input validation |
| `user.service.js` | Business logic |
| `user.resolver.js` | GraphQL resolvers |
| `user.graphql` | GraphQL type definitions |
| `user.test.js` | Jest unit tests |
