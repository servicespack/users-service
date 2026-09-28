# AI Agents Project Guide (`AGENTS.md`)

This document serves as the primary technical guide and reference manual for AI agents and human developers working on, maintaining, or extending this repository.

---

## 1. Project Overview

`@servicespack/users-service` is a microservice dedicated to user management, authentication, and credential verification. Its core responsibilities include:
- **User Management**: Creation, paginated listing with text search capabilities, retrieval by ID, profile updates, password modification, and user deletion.
- **Authentication**: Issuing and verifying JSON Web Tokens (JWT).
- **Email Verification**: Verification flow using unique, temporary keys (`emailVerificationKey`).
- **Security**: Strong password hashing with **Argon2** (`@node-rs/argon2`), input sanitization against XSS (`xss`), and defense against ReDoS (Regular Expression Denial of Service) via `safe-regex`.

---

## 2. Technology Stack

- **Runtime & Language**: [Node.js](https://nodejs.org/) (ES Modules), [TypeScript](https://www.typescriptlang.org/) (5.x, target `ES2022`, module/resolution `NodeNext`).
- **Web Framework**: [Express](https://expressjs.com/) (v5.x) with native async route handling.
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) managed via [Mongoose](https://mongoosejs.com/) (v8.x).
- **Validation & Transformation**: [class-validator](https://github.com/typestack/class-validator) and [class-transformer](https://github.com/typestack/class-transformer).
- **Cryptography & Tokens**: `@node-rs/argon2`, `jsonwebtoken`.
- **API Documentation**: OpenAPI 3.0 served via `swagger-ui-express` at `/docs`.
- **Security Middlewares**: `helmet`, `cors`, `xss`, `safe-regex`.
- **Logging**: [Pino](https://getpino.io/) and `pino-http` (with `pino-pretty` for development output).
- **Testing Suite**:
  - [Vitest](https://vitest.dev/) (fast, native TypeScript test runner).
  - [Supertest](https://github.com/ladjs/supertest) for HTTP endpoint e2e testing.
  - [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) providing isolated, ephemeral in-memory MongoDB instances.
  - [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) for code coverage analysis.
  - [Stryker Mutator](https://stryker-mutator.io/) for mutation testing.
- **Build & Development Tools**: `tsdown` (bundler), `tsx` (TypeScript execution & watch).
- **Linter & Formatter**: [ESLint](https://eslint.org/) configured with [@antfu/eslint-config](https://github.com/antfu/eslint-config).

---

## 3. Directory Structure and Architecture

The codebase adheres to a Clean Architecture layout designed for strict separation of concerns, framework independence, and high testability.

```
├── .agents/
│   ├── rules/
│   │   └── coding-style.md     # ESLint code style rules and conventions
│   └── skills/
│       └── clean-architecture/ # Clean Architecture skill, standards and diagnostics
├── src/
│   ├── index.ts                # Application entrypoint (bootstraps DB, HTTP listener)
│   ├── adapters/               # Circle 3: Interface Adapters (Delivery Adapters)
│   │   ├── controllers/        # Express controllers (Humble Objects)
│   │   ├── dtos/               # Request payload DTOs (class-validator)
│   │   ├── helpers/            # HTTP error mapping helpers
│   │   └── middlewares/        # Express middlewares (auth, validator)
│   ├── application/            # Circle 2: Application Business Rules (Use Cases & Ports)
│   │   ├── dtos/               # Boundary Request/Response models (readonly)
│   │   ├── ports/              # Abstract ports (IPasswordHasher, ITokenProvider, etc.)
│   │   └── use-cases/          # Focused single-responsibility use cases
│   ├── config/                 # Application configuration, logger, and lifecycle hooks
│   │   ├── configuration.dto.ts# Configuration DTO and environment validation schemas
│   │   ├── configuration.ts    # Loads, validates, and exports environment config
│   │   ├── cooldown.ts         # Handles termination signals (SIGHUP, SIGINT, SIGTERM)
│   │   ├── database.ts         # MongoDB connection & schema validation enforcement
│   │   └── logger.ts           # Pino logger configuration
│   ├── docs/                   # OpenAPI / Swagger specification
│   ├── domain/                 # Circle 1: Enterprise Business Rules (Pure TypeScript)
│   │   ├── entities/           # Pure domain entities (User) with domain methods
│   │   ├── errors/             # Specific domain errors (UserNotFoundError, etc.)
│   │   └── repositories/       # Pure repository interfaces (IUserRepository)
│   └── infrastructure/         # Circles 3 & 4: Frameworks, Drivers, and Adapters
│       ├── database/mongoose/  # Mongoose models, schemas, user mapper, and repository adapter
│       ├── http/               # HTTP web server & router composition root
│       │   ├── router.ts       # Composition Root: wires infra, use cases, and controllers
│       │   └── server.ts       # Express setup, global middlewares, and error handler
│       ├── notifications/      # Notification sender implementations
│       └── security/           # Argon2 and JWT provider adapter implementations
└── tests/                      # End-to-end tests, unit tests, and test utilities
    ├── __mocks__/              # Mock factories and fixtures
    ├── e2e/                    # Integration / E2E endpoint tests using supertest
    │   ├── docs.spec.ts
    │   ├── healthcheck.spec.ts
    │   ├── passwords.spec.ts
    │   ├── tokens.spec.ts
    │   ├── update-password.spec.ts
    │   ├── users.spec.ts
    │   └── verifications.spec.ts
    ├── integration/            # Database and repository integration tests
    │   └── mongoose-user.repository.integration.spec.ts
    ├── configuration.spec.ts
    ├── server.spec.ts
    ├── setup.ts                # Global test setup (spawns mongodb-memory-server)
    └── teardown.ts             # Global test teardown (disconnects and stops mongo server)
```

### Architectural Details

- **`src/domain/` (Enterprise Business Rules)**:
  - Pure domain entities (e.g. `User`) containing enterprise business rules (`verifyEmail`, `changePassword`, `updateProfile`), protecting invariants with zero framework or ORM dependencies.
  - Domain error classes (`UserNotFoundError`, `InvalidCredentialsError`, `WrongVerificationKeyError`, etc.).
  - Pure repository contracts (`IUserRepository`) with zero runtime overhead.
- **`src/application/` (Application Business Rules)**:
  - Single-operation Use Cases (e.g., `CreateUserUseCase`, `ListUsersUseCase`, `CreateTokenUseCase`, `VerifyEmailUseCase`).
  - Readonly boundary Request/Response models.
  - Abstract ports for external dependencies (`IPasswordHasher`, `ITokenProvider`).
- **`src/adapters/` (Interface Adapters)**:
  - `src/adapters/controllers/`: Controllers act as Humble Objects: they parse HTTP requests, invoke use cases, and format HTTP responses.
  - `src/adapters/dtos/`: Encapsulate incoming request payloads and validate them using `class-validator` and `class-transformer` with definite assignment assertions (`!`).
  - `src/adapters/middlewares/`: Express middlewares (`auth`, `validator`).
  - `src/adapters/helpers/`: `handleHttpError` translates domain errors to HTTP status codes (`400`, `401`, `404`, `409`).
- **`src/infrastructure/` (Adapters & External Drivers)**:
  - `MongooseUserRepository` implements `IUserRepository` using Mongoose and `UserMapper`.
  - `Argon2PasswordHasher` implements `IPasswordHasher` using `@node-rs/argon2`.
  - `JwtTokenProvider` implements `ITokenProvider` using `jsonwebtoken`.
  - `HttpNotificationSender` implements `INotificationSender` using an HTTP API.
  - `src/infrastructure/http/router.ts` (Composition Root): Central place where infrastructure adapters and use cases are instantiated and injected into controllers.
  - `src/infrastructure/http/server.ts`: Initializes Express, mounts global middlewares (`cors`, `helmet`, `pino-http`, `express.json`), and mounts router.
- **`src/docs/`**:
  - OpenAPI 3.0 specification (`swaggerDocument`).

---

## 4. Commands and Scripts

| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Runs the server in development mode with live watch (`tsx watch --env-file=.env`) piped to `pino-pretty`. |
| `npm run build` | Builds the project for production into `dist/` using `tsdown`. |
| `npm start` | Executes the built production bundle (`dist/index.js`). |
| `npm run build:check` | Validates TypeScript types across the project without emitting output (`tsc --noEmit`). |
| `npm run lint` | Checks code formatting and linter rules with ESLint (`@antfu/eslint-config`). |
| `npm run lint:fix` | Automatically fixes linting and style errors where supported. |
| `npm test` | Runs the complete test suite once using [Vitest](https://vitest.dev/). |
| `npm run test:watch` | Runs Vitest in interactive watch mode for active test-driven development. |
| `npm run test:cov` | Runs tests and computes detailed code coverage using `@vitest/coverage-v8`. |
| `npm run test:mutation`| Executes mutation testing via [Stryker Mutator](https://stryker-mutator.io/) to evaluate test suite quality. |

---

## 5. Coding Standards and Style Guide

The project strictly follows the `@antfu/eslint-config` rules documented in `.agents/rules/coding-style.md`:

1. **No Semicolons**: Do not place semicolons at the ends of statements (rely on Automatic Semicolon Insertion).
2. **Single Quotes**: Use single quotes (`'`) for string literals, unless double quotes reduce escaping.
3. **Indentation**: Use **2 spaces** consistently (never tabs).
4. **Trailing Commas**: Always include trailing commas in multiline object literals, arrays, imports, exports, and function parameter lists.
5. **Arrow Functions**: Consistently prefer arrow functions for controller methods, handlers, and anonymous callbacks.
6. **Strict TypeScript**:
   - `strict: true` is enabled in `tsconfig.json`.
   - Avoid `any`. Prefer explicit types, interfaces, or `unknown` when input is unvalidated.
   - Accurately type Express requests and responses (`Request<Params, ResBody, ReqBody, ReqQuery>`).
   - Retain decorator support (`experimentalDecorators` and `emitDecoratorMetadata` enabled for `class-validator` and `class-transformer`).

---

## 6. Testing & Coverage Guidelines

- **Coverage Target**: Maintain high test coverage (>95% lines, statements, functions, and branches).
- **Unit Tests**:
  - Located side-by-side with source files (e.g., `src/adapters/controllers/users.controller.spec.ts`).
  - Unit tests must mock external libraries, databases, and encryption utilities (`vi.mock('@node-rs/argon2')`, mocked Mongoose models).
- **End-to-End (E2E) Tests**:
  - Located in `tests/e2e/`.
  - Must test full HTTP request-response lifecycles against real in-memory MongoDB storage.
  - Cover both success scenarios (HTTP `200`, `201`, `204`) and standard error conditions:
    - `400 Bad Request`: Validation failure from `validator` middleware or unsafe search query.
    - `401 Unauthorized`: Missing token, invalid token, incorrect password, wrong verification key, or forbidden owner access (`onlyTheOwner`).
    - `404 Not Found`: Querying non-existent entity IDs.
    - `409 Conflict`: Unique index violation (duplicate username or email).

---

## 7. Mandatory AI Agent Guidelines

Whenever an AI agent modifies or adds code in this repository, it must adhere to the following workflow:

1. **Preserve Code & Documentation Integrity**:
   - Do not remove or alter existing comments, docstrings, or type definitions unless directly required by the task.
   - Maintain naming conventions (`kebab-case` for DTOs and middlewares, `*.controller.ts` for controllers, `*.spec.ts` for unit tests).
2. **Mandatory Verification Routine**:
   Before marking any task as complete, you must run and ensure zero errors on:
   ```bash
   npm run build:check
   npm run lint
   npm test
   ```
   If lint issues can be fixed automatically, run `npm run lint:fix` and rerun the checks.
3. **Feature Addition Protocol**:
   - Define DTOs in `src/adapters/dtos/` with `class-validator` rules and `!` assertions.
   - Define domain entities and errors in `src/domain/` if new business rules or entities are introduced.
   - Define use cases in `src/application/use-cases/` and abstract ports in `src/application/ports/`.
   - Implement infrastructure adapters in `src/infrastructure/` (e.g. Mongoose repositories, security/notification providers).
   - Implement thin controllers in `src/adapters/controllers/` injecting use cases.
   - Bind routes, middlewares, and wire dependencies in `src/infrastructure/http/router.ts`.
   - Add comprehensive unit tests (domain entities, use cases, controllers) and e2e tests covering both happy and error paths.
4. **API Documentation Maintenance Protocol**:
   - Sempre que houver adição, alteração ou exclusão de rotas, a especificação Swagger/OpenAPI deve ser obrigatoriamente atualizada.

