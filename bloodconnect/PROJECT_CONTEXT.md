# BloodConnect: Project Context & Architectural Specification

## 1. System Vision & Problem Statement
Existing platforms (e.g., e-RaktKosh) provide blood bank inventory tracking and centralized donor directories. However, when an acute emergency shortage arises at a hospital, an **Emergency Coordination Gap** emerges:
1. Hospital inventory is depleted or insufficient.
2. Assigned regional blood centre cannot fulfill the entire quantity immediately from shelf stock.
3. Donors must be mobilized rapidly within geographical proximity without compromising clinical safety or privacy.
4. Coordination between blood centre staff, voluntary donors, and emergency NGO networks is ad-hoc, prone to delays, and lacks visibility.

**BloodConnect** bridges this gap through an AI-assisted and rule-based state machine orchestrator that manages progressive emergency case escalation, privacy-preserving donor mobilization, and verification auditing until resolution.

---

## 2. Fundamental Safety Constraints (Invariable Core)
1. **Never declare a donor medically eligible:** System UI and APIs refer strictly to "potential donors" and "willing to help, pending screening".
2. **Never decide blood compatibility:** No compatibility charts, heuristics, or blood mixing rules exist anywhere in the codebase. Blood centres determine compatibility exclusively.
3. **No blood buying/selling or person-to-person marketplace:** Voluntary mobilization only. Zero pricing, fees, or monetary fields.
4. **Approximate Location Only:** Donor home addresses are never stored. Geolocation is stored strictly rounded to 2 decimal places (~1.1 km precision) and grid cell tokens.
5. **Role-Based Access Control & Ownership:** Strict tenant/user data boundaries with role authorization (`DONOR`, `HOSPITAL`, `BLOOD_CENTRE`, `NGO`, `ADMIN`).
6. **Append-Only Auditing:** Immutable audit logs and stage transitions for forensic compliance.

---

## 3. Tech Stack
- **Monorepo:** pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`, `docs`)
- **Backend:** Express.js, TypeScript, Prisma ORM, PostgreSQL, Zod validation, pino logging, Helmet, Rate limiting.
- **Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, Recharts, SSE hooks.
- **Orchestration:** Pure function stage transitions (`evaluateNextStage`), row-level locks, pg-boss/timer recovery sweeper.
- **Real-Time:** Server-Sent Events (SSE) hub for instant emergency notifications and case progress streams.
