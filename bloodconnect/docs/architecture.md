# BloodConnect System Architecture

## 1. High-Level Architecture Overview
BloodConnect is architected as a decoupled, multi-tenant monorepo organized via `pnpm` workspaces:
- `apps/api`: Express.js + TypeScript REST API and State Machine Orchestrator.
- `apps/web`: Next.js (App Router) React application with role-tailored workspaces.
- `packages/shared`: Shared TypeScript domain types, enums, and Zod validation schemas.
- `docs`: Architectural blueprints, viva defense documentation, and clinical safety constraints.

```
                           +------------------------------------------+
                           |           Next.js 15 Web Client          |
                           |   (Donor / Hospital / Centre / Admin)   |
                           +--------------------+---------------------+
                                                | HTTP / REST + SSE
                                                v
                           +------------------------------------------+
                           |           Express.js API Engine          |
                           |  (Auth, RBAC, Validation, Pino Logger)   |
                           +--------------------+---------------------+
                                                |
              +---------------------------------+---------------------------------+
              |                                 |                                 |
              v                                 v                                 v
+---------------------------+     +---------------------------+     +---------------------------+
| Emergency Response Engine |     |     SSE Real-Time Hub     |     |   Matching & Geolocation  |
|  (evaluateNextStage Pure  |     |  (Live Notification Feed, |     | (Haversine ~1.1km Approx, |
|   State Machine & Timers) |     |     Heartbeat Stream)     |     |   Privacy Grid Cells)     |
+-------------+-------------+     +---------------------------+     +---------------------------+
              |
              v
+-----------------------------------------------------------------------------------------------+
|                        Data & Repository Layer (Prisma ORM + PostgreSQL)                      |
|                  Append-Only History, Triggers, Row-Level Locks (SELECT FOR UPDATE)           |
+-----------------------------------------------------------------------------------------------+
```

---

## 2. Layered API Design
The backend adheres strictly to layered software engineering:
1. **Routes (`routes.ts`):** Mount endpoints, attach rate limiters, validation middleware (`validate(Schema)`), and RBAC guards (`requireRoles`).
2. **Controllers (`controller.ts`):** Unpack HTTP request params/body and wrap outputs inside standard API envelopes (`res.envelope(data)`).
3. **Services (`service.ts`):** Coordinate business logic, invoke the state machine orchestrator, and trigger audit logging.
4. **Repositories & DB Store (`dbStore.ts` / Prisma):** Directly touch the database. Enforce transactions, atomic updates, and append-only constraints.

---

## 3. Concurrency & Transaction Safety
- Every status transition runs in an isolated database transaction with row locks (`SELECT ... FOR UPDATE`) on `emergency_cases`.
- Optimistic versioning counter (`version`) prevents race conditions if multiple donor responses arrive simultaneously.
- Idempotent operations on donor response submission: submitting twice updates the record rather than creating duplicates.
