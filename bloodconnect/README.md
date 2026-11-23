# BLOODCONNECT: AI-Assisted Emergency Blood Coordination Platform

**Final-Year BTech Computer Science & Engineering Capstone Project**  
*Academic & Clinical Viva Demonstration Edition*

---

## 1. Project Overview & Clinical Positioning
BloodConnect is **NOT** a blood-bank management system and **NOT** an e-RaktKosh clone. Existing systems already track static shelf stock and blood bank registries. 

BloodConnect solves the **EMERGENCY COORDINATION GAP**: when a hospital urgently needs a blood component and the assigned authorized blood centre cannot supply enough from shelf inventory, BloodConnect coordinates the remaining requirement among registered voluntary donors, partner NGO networks, and secondary blood centres through a deterministic multi-stage escalation state machine.

### Core Emergency Workflow:
```
Hospital Emergency Request
          ↓
Authorized Blood Centre Verifies Shortage & Confirms Shortage Units
          ↓
Centre Activates Emergency Case (Stage 1: Proximity ~5 km radius)
          ↓
Progressive Notification to Registered Potential Donors
          ↓
Donors Answer "I Can Help" / "Cannot Help" (Willingness Only)
          ↓
If responses insufficient upon 10-min timeout → Auto-Escalates to Stage 2 (~15 km)
          ↓
If still insufficient → Auto-Escalates to Stage 3 (NGO Volunteer Mobilization)
          ↓
If still insufficient → Auto-Escalates to Stage 4 (Regional Network Escalation)
          ↓
Blood Centre conducts clinical screening, infectious disease testing & phlebotomy
          ↓
Centre records official donation outcomes → Case reaches FULFILLED → CLOSED
```

---

## 2. Fundamental Safety & Ethics Constraints
1. **Never declare a donor medically eligible:** System UI and APIs refer strictly to "potential donors" and "willing to help, pending screening".
2. **Never decide blood compatibility:** No compatibility charts, heuristics, or blood mixing rules exist anywhere in the codebase. Blood centres determine compatibility exclusively.
3. **No person-to-person blood marketplace:** Direct patient-to-donor exchange is prohibited. Zero monetary fields or pricing exist.
4. **Approximate Location Only:** Exact donor home addresses are **NEVER** stored. Geolocation is stored strictly rounded to 2 decimal places (~1.1 km precision) and grid cell tokens (`GRID_12.98_77.60`).
5. **Role-Based Access Control & Scoping:**
   - **Hospitals** see aggregate counts only ("3 potential donors responded"). Never donor identities.
   - **Blood Centres** see full coordination details for verified cases.
   - **Donors** see only cases they were specifically targeted for.
   - **Admins** oversee statutory compliance and audit ledgers.

---

## 3. Tech Stack

| Component | Technology |
|---|---|
| **Monorepo** | `pnpm` workspaces (`apps/web`, `apps/api`, `packages/shared`, `docs`) |
| **Backend** | Node.js, Express.js, TypeScript, Pino logging, Helmet, CORS, Rate limiting |
| **Database** | PostgreSQL + Prisma ORM (with zero-config embedded local persistence fallback) |
| **Validation** | Zod schemas shared from `@bloodconnect/shared` |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons |
| **Real-Time** | Server-Sent Events (SSE) with heartbeat stream |
| **Testing** | Vitest unit tests for orchestrator, state transitions, and safety constraints |

---

## 4. Quick Start: How to Run in VS Code on Windows

### Prerequisites:
- **Node.js** v18+ or v20+ installed on your computer.
- **pnpm** (recommended) or **npm**. If you don't have pnpm, install it globally:
  ```powershell
  npm install -g pnpm
  ```

### Step 1: Open Folder in VS Code
1. Extract the `bloodconnect.zip` archive.
2. In VS Code, go to **File** &rarr; **Open Folder...** and select the extracted `bloodconnect` folder.

### Step 2: Install Dependencies
Open a PowerShell terminal in VS Code (`Ctrl + \``) and run:
```powershell
pnpm install
```
*(Or `npm install` if using npm)*

### Step 3: Build the Shared Package
```powershell
pnpm --filter @bloodconnect/shared build
```

### Step 4: Run the Application
Start both the Backend API and the Next.js Frontend concurrently with a single command:
```powershell
pnpm dev
```
*(Or in separate terminal tabs: `pnpm dev:api` and `pnpm dev:web`)*

### Step 5: Open in Your Browser
- **Frontend Web Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Health Check Endpoint:** [http://localhost:4000/health](http://localhost:4000/health)

> **Zero Database Setup Needed:** The backend includes an embedded persistent storage engine pre-loaded with realistic Bengaluru hospitals, blood centres, NGOs, and ~100 voluntary donors. If you have PostgreSQL, simply provide your `DATABASE_URL` in `.env` and run `pnpm --filter @bloodconnect/api db:push`.

---

## 5. Instant 1-Click Demo Accounts (Viva Evaluation)

On the login page ([http://localhost:3000/login](http://localhost:3000/login)), you can click any of the 1-click viva demonstration buttons, or use these credentials:

| Role | Email | Password | Role Description |
|---|---|---|---|
| **System Administrator** | `admin@bloodconnect.org` | `Admin@12345` | Platform supervision, analytics, org approvals & audit exports |
| **Hospital Requester** | `hospital.victoria@bloodconnect.org` | `Password@123` | Victoria Hospital emergency request dispatcher |
| **Blood Centre Officer** | `centre.redcross@bloodconnect.org` | `Password@123` | Red Cross Centre verification & clinical outcomes recording |
| **Voluntary Donor** | `donor@bloodconnect.org` | `Password@123` | O+ Voluntary Donor (Bengaluru Central) with live alerts |
| **NGO Mobilizer** | `ngo.lions@bloodconnect.org` | `Password@123` | Lions Blood Foundation volunteer network coordinator |

---

## 6. Project Monorepo Structure

```
bloodconnect/
├── apps/
│   ├── web/                         # Next.js 15 App Router Frontend
│   │   ├── src/
│   │   │   ├── app/                 # Role-based routes: (public), /donor, /hospital, /centre, /ngo, /admin
│   │   │   ├── components/ui/       # Design System (Button, Input, Select, Card, Modal, StatusBadge, etc.)
│   │   │   ├── components/shared/   # Shared widgets (CaseTimeline, StageCountdown, NotificationBell, LocationPicker)
│   │   │   ├── hooks/               # useNotifications (Server-Sent Events)
│   │   │   ├── lib/api.ts           # Typed API client with automatic JWT token refresh
│   │   │   └── providers/           # AuthProvider (persistent session state)
│   │   └── Dockerfile
│   └── api/                         # Node.js + Express.js API & Orchestrator
│       ├── prisma/
│       │   ├── schema.prisma        # PostgreSQL Schema with 28 tables & relations
│       │   ├── safety_constraints.sql # PostgreSQL append-only triggers and safety constraints
│       │   └── seed.ts              # Seeding script with ~100 Bengaluru donors and live cases
│       ├── src/
│       │   ├── config/              # Zod-validated environment config
│       │   ├── common/              # AppError, error handlers, rate limiting, RBAC middleware
│       │   ├── data/dbStore.ts      # Multi-table repository store with transaction locks
│       │   ├── jobs/                # Stage timeout scheduler with 30s recovery sweeper
│       │   └── modules/
│       │       ├── orchestrator/    # Pure evaluateNextStage function, stateMachine, stageRunner
│       │       ├── matching/        # Haversine distance & privacy spatial matching
│       │       ├── notifications/   # SSE Hub with heartbeats, InAppChannel, EmailChannel
│       │       ├── auth/            # JWT access & rotating refresh token rotation
│       │       ├── requests/        # Hospital emergency requests & blood centre verification
│       │       ├── cases/           # Case command center & donation outcome ledger
│       │       ├── ngo/             # Volunteer roster management & broadcast dispatch
│       │       └── admin/           # Analytics, organization approvals, CSV audit exports
│       ├── tests/                   # Vitest unit & safety constraint tests
│       └── Dockerfile
├── packages/shared/                 # Shared TypeScript Package
│   └── src/
│       ├── enums.ts                 # RequestStatus, CaseStatus, BloodGroup, Urgency, etc.
│       ├── schemas/                 # Zod validation schemas shared between client and server
│       └── types/                   # Response envelopes, JWT payloads, and role views
├── docs/                            # Comprehensive Technical & Viva Documentation
│   ├── architecture.md              # System design and concurrency management
│   ├── api.md                       # Complete REST API reference
│   ├── state-machine.md             # Orchestrator transition tables and pure evaluator rules
│   ├── safety-and-ethics.md         # 10 Invariable Clinical Safety Rules
│   └── viva-preparation.md          # Examiner Q&A, viva defense points, and demo script
├── docker-compose.yml               # Multi-container orchestration (Postgres, API, Web)
├── pnpm-workspace.yaml              # Monorepo configuration
├── PROJECT_CONTEXT.md               # Architectural specification
└── README.md                        # This document
```

---

## 7. Running Unit & Safety Tests
To run the automated test suite verifying the pure evaluator function and safety constraints:
```powershell
pnpm --filter @bloodconnect/api test
```

---

## 8. Docker Deployment
To launch the full production environment using Docker and PostgreSQL:
```powershell
docker-compose up --build -d
```
This spins up:
- PostgreSQL database on port `5432`
- BloodConnect API on port `4000`
- BloodConnect Web Application on port `3000`
