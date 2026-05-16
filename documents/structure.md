# Project Structure

This document presents the **fully industry-standard monolithic modular backend architecture** for the **Twelve Creative** project, built with **Node.js, Express, TypeScript**. It is designed to be **scalable, maintainable, and production-ready**.

---

## 1. Root Folder Structure

```plaintext
project-root/
├─ documents/                # Project documentation
│  ├─ apis/                  # API documentation and Postman collections
│  │  ├─ auth_apis/          # Auth module docs & collection
│  │  └─ user_apis/          # User module docs & collection
│  ├─ memories/              # Architectural Decision Records (ADR)
│  ├─ plans/                 # Feature implementation roadmaps
│  │  ├─ [feature_name]/
│  │  │  ├─ plan.md
│  │  │  └─ tasks.md
│  │  └─ README.md
│  ├─ roles.md       # Development Rules and Guidelines
│  ├─ structure.md   # This file (Source of truth)
│  └─ specification.md # Functional requirements
├─ infra/                    # Infrastructure & deployment config
│  ├─ docker/                # Dockerfiles and docker-compose
│  ├─ nginx/                 # Nginx configuration
│  └─ monitoring/            # Grafana, Prometheus configs
├─ public/                   # Static files for frontend distribution (Ignored)
├─ uploads/                  # Temporary and persistent file uploads (Ignored)
├─ dist/                     # Compiled JS output
├─ src/                      # Source code (see Section 2)
├─ tests/                    # Integration/E2E tests
├─ .env                      # Environment variables
├─ .env.example              # Template for environment variables
├─ package.json
├─ tsconfig.json
├─ jest.config.ts
├─ eslint.config.js
├─ .prettierrc.json
└─ README.md
```

---

## 2. `src/` Folder Structure

```plaintext
src/
├─ config/                   # Configuration files (all service configs live here)
│  ├─ index.ts               # Re-exports env config (default import entry)
│  ├─ env.ts                 # All environment variable mappings
│  ├─ db.ts                  # MongoDB connection setup
│  ├─ redis.ts               # Redis client (cache, pub, sub)
│  ├─ socket.ts              # Socket.io server setup
│  ├─ rabbitmq.ts            # RabbitMQ connection
│  ├─ kafka.ts               # Kafka producer/consumer
│  └─ (logger.ts)            # Logger setup [planned]
│
├─ constants/                # Application-wide constants
│  ├─ app-constants.ts       # Status enums, limits, defaults
│  └─ error-codes.ts         # Standardized error code strings
│
├─ enums/                    # Shared enums
│  └─ user-role.enum.ts      # UserRole enum
│
├─ validators/               # Shared reusable validators
│  └─ request-validator.ts   # Generic Zod request validator
│
├─ policies/                 # Shared access control policies
│  └─ rbac.policy.ts         # Role-based permission matrix
│
├─ events/                   # Application event system
│  └─ event-publisher.ts     # In-process pub/sub event publisher
│
├─ services/                 # Shared reusable services
│  ├─ email.service.ts       # Email sending (re-exports from utils)
│  ├─ cache.service.ts       # Cache helpers (re-exports from utils)
│  ├─ token.service.ts       # JWT create/verify
│  └─ notification.service.ts# Notification sender (re-exports)
│
├─ providers/                # Third-party service providers
│  └─ README.md              # Stripe, bKash, SSLCommerz, GCS — planned
│
├─ jobs/                     # Background scheduled tasks
│  └─ index.ts               # Job registry (node-cron / setInterval)
│
├─ scripts/                  # One-time/maintenance scripts
│  └─ README.md
│
├─ templates/                # Email & notification HTML templates
│  └─ README.md
│
├─ middlewares/              # Express middlewares
│  ├─ auth.middleware.ts     # JWT auth + role check + Redis cache
│  ├─ error.middleware.ts    # Global error handler
│  ├─ validation.middleware.ts # Zod schema validation runner
│  ├─ file.middleware.ts     # Multer file upload middleware
│  ├─ storage.middleware.ts  # GCS/local storage middleware
│  ├─ guest.middleware.ts    # Anonymous guest session middleware
│  ├─ log.middleware.ts      # Request logging
│  ├─ not-found.middleware.ts# 404 handler
│  ├─ rate-limit.middleware.ts# Global & per-route rate limiting
│  └─ sanitize.middleware.ts # Mongo sanitize / XSS protection
│
├─ builder/                  # Reusable builder classes
│  ├─ app-error.ts           # AppError — custom HTTP error class
│  ├─ app-query-find.ts      # AppQueryFind — chainable query builder
│  └─ app-query-aggregation.ts # AppAggregationQuery — aggregation builder
│
├─ utils/                    # Generic utility functions
│  ├─ catch-async.ts         # Wraps controllers to eliminate try/catch
│  ├─ send-response.ts       # Standardized API response sender
│  ├─ cache.utils.ts         # withCache / generateCacheKey / invalidate
│  ├─ send-email.ts          # Email sending via nodemailer
│  ├─ slugify.ts             # URL-safe slug generator
│  ├─ dir-year-month.ts      # Upload directory date-based organizer
│  └─ delete-files.ts        # Local file cleanup utility
│
├─ types/                    # Global TypeScript type declarations
│  ├─ jsonwebtoken.type.ts   # TJwtPayload, TRole
│  ├─ response.type.ts       # API response shape
│  └─ error-response.type.ts # Error response shape
│
├─ errors/                   # Error formatting handlers
│  ├─ handle-cast-error.ts
│  ├─ handle-duplicate-error.ts
│  ├─ handle-validation-error.ts
│  └─ handle-zod-error.ts
│
├─ interface/                # Express Request interface extension
│  └─ index.d.ts             # Augments req.user, req.guest
│
├─ modules/                  # Feature-based modules (see Section 3)
│  └─ [module-name]/
│
├─ routes/                   # Route aggregation
│  └─ index.ts               # Registers all module routes under /api
│
├─ app.ts                    # Express app setup (middleware + routes)
├─ index.ts                  # Entry point (cluster + server startup)
└─ serverless.ts             # Vercel/serverless entry point
```

---

## 3. Module Structure (`src/modules/[module-name]/`)

Each module is **fully self-contained**. All modules follow this exact file layout:

```plaintext
[module-name]/
├─ [module-name].model.ts        # Mongoose schema + model
├─ [module-name].controller.ts   # Request handlers (no business logic)
├─ [module-name].service.ts      # Business logic + external calls
├─ [module-name].repository.ts   # All DB queries
├─ [module-name].route.ts        # Express router + middleware chain
├─ [module-name].type.ts         # TypeScript types (TX, TXDocument, TXModel)
├─ [module-name].validator.ts    # Zod validation schemas
├─ [module-name].util.ts         # Module-specific helper functions
├─ [module-name].constant.ts     # Module-level constants (cache prefix, TTL, etc.)
├─ [module-name].enum.ts         # Module-level enums
├─ [module-name].policy.ts       # Module-level RBAC role arrays
├─ [module-name].event.ts        # Module-level event emitters
└─ __tests__/                    # Unit tests
   ├─ [module-name].service.spec.ts
   └─ [module-name].route.spec.ts
```

### Active Modules

| Module                   | Path                          | Description                                         |
| ------------------------ | ----------------------------- | --------------------------------------------------- |
| `auth`                   | `/api/auth`                   | Login, signup, Google OAuth, tokens, password reset |
| `user`                   | `/api/user`                   | User CRUD, 7-role system                            |
| `user-profile`           | `/api/user-profile`           | Extended user profile data                          |
| `guest`                  | `/api/guest`                  | Anonymous guest sessions                            |
| `news`                   | `/api/news`                   | Core news articles with full lifecycle              |
| `news-headline`          | `/api/news-headline`          | Short headline snippets linked to news              |
| `news-break`             | `/api/news-break`             | Breaking news alerts                                |
| `article-version`        | `/api/article-version`        | News content versioning/snapshots                   |
| `category`               | `/api/category`               | Hierarchical categories (graphLookup)               |
| `event`                  | `/api/event`                  | News topics/events                                  |
| `comment`                | `/api/comment`                | Comments on news articles                           |
| `comment-enhanced`       | `/api/comment-enhanced`       | Threaded/nested comments                            |
| `reaction`               | `/api/reaction`               | Like/dislike reactions                              |
| `view`                   | `/api/view`                   | Article view tracking                               |
| `bookmark`               | `/api/bookmark`               | User bookmarks                                      |
| `file`                   | `/api/file`                   | File upload and management                          |
| `media`                  | `/api/media`                  | Media library (image/video/audio)                   |
| `notification`           | `/api/notification`           | Notification creation and sending                   |
| `notification-recipient` | `/api/notification-recipient` | Per-user notification delivery                      |
| `poll`                   | `/api/poll`                   | Polls attached to news articles                     |
| `badge`                  | `/api/badge`                  | User achievement badges                             |
| `workflow`               | `/api/workflow`               | Editorial workflow stages per news                  |
| `template`               | `/api/template`               | Content templates                                   |
| `scheduler`              | —                             | Background job (auto-publish, auto-archive)         |

---

## 4. News Lifecycle

```
draft → pending → scheduled → published → archived
```

- Scheduler runs every **60 seconds**
- Auto-publishes when `published_at <= now`
- Auto-archives when `expired_at < now`
- Default expiry: **24 hours** after `published_at`

---

## 5. Naming Conventions

| Item              | Convention                 | Example                                 |
| ----------------- | -------------------------- | --------------------------------------- |
| Directories       | `kebab-case`               | `news-headline/`, `user-profile/`       |
| Module files      | `[module].[role].ts`       | `news.controller.ts`, `auth.service.ts` |
| Shared constants  | `src/constants/*.ts`       | `app-constants.ts`                      |
| Shared enums      | `src/enums/*.ts`           | `user-role.enum.ts`                     |
| Shared validators | `src/validators/*.ts`      | `request-validator.ts`                  |
| Shared policies   | `src/policies/*.ts`        | `rbac.policy.ts`                        |
| DB schema fields  | `snake_case`               | `is_deleted`, `published_at`            |
| TypeScript types  | `T` prefix PascalCase      | `TUser`, `TNewsDocument`                |
| Zod schemas       | `*ValidationSchema` suffix | `signinValidationSchema`                |
| Tests             | `.spec.ts`                 | `auth.service.spec.ts`                  |
| Documentation     | `snake_case.md`            | `structure.md`                          |

---

## 6. Communication Flow (Unidirectional)

```
Request
  → Route
  → Middleware (auth, rate-limit, sanitize)
  → Validator (Zod schema)
  → Controller (orchestration only)
  → Service (business logic)
  → Repository (DB queries)
  → Model (Mongoose)
  → Response
```

---

## 7. Shared Infrastructure

| Layer           | Location                               | Purpose                                         |
| --------------- | -------------------------------------- | ----------------------------------------------- |
| Config          | `src/config/`                          | All env vars and service connections            |
| Error class     | `src/builder/app-error.ts`             | `AppError(status, message)`                     |
| Query builder   | `src/builder/app-query-find.ts`        | Chainable: search/filter/sort/paginate          |
| Aggregation     | `src/builder/app-query-aggregation.ts` | Complex MongoDB aggregations                    |
| Cache           | `src/utils/cache.utils.ts`             | `withCache`, `invalidateCacheByPattern`         |
| Auth middleware | `src/middlewares/auth.middleware.ts`   | JWT + Redis-cached user lookup                  |
| Response        | `src/utils/send-response.ts`           | Standardized `{ success, message, data, meta }` |
| Event bus       | `src/events/event-publisher.ts`        | In-process pub/sub                              |
| RBAC            | `src/policies/rbac.policy.ts`          | Role-permission matrix                          |

---

## 8. Testing Conventions

- Unit tests: `__tests__/` inside each module, file naming `.spec.ts`
- Integration/E2E tests: root `tests/` folder
- Use `.spec.ts` (not `.test.ts`) — aligns with NestJS/Jest/Angular standard

---

## ✅ Summary

- **Monolithic yet modular** — single repo, self-contained feature modules
- **Flat `src/` structure** — no unnecessary nesting, easy imports
- **Separated config** — each service (Redis, Kafka, Socket, DB) has its own `config/*.ts`
- **Full module anatomy** — every module has model, controller, service, repository, route, type, validator, util, constant, enum, policy, event, tests
- **Production-ready** — soft delete, Redis cache, Socket.io clustering, Node.js cluster mode, Kafka/RabbitMQ ready
