# Viva Voce & Technical Defense Guide

This guide prepares you to defend BloodConnect in your BTech Computer Science & Engineering final-year project viva.

---

## 1. Project Synopsis in 60 Seconds
> "Sir/Madam, BloodConnect is an AI-assisted emergency blood coordination and progressive donor mobilization platform. Existing national portals like e-RaktKosh manage centralized inventory across blood banks. However, when an acute surgical emergency arises at a hospital and shelf stock is depleted, an **Emergency Coordination Gap** emerges. 
> BloodConnect solves this gap through a deterministic state machine orchestrator that progressively mobilizes verified voluntary donors within a ~5 km radius, automatically escalates to ~15 km upon timeout, activates emergency NGO volunteer networks in Stage 3, and escalates to regional blood centres in Stage 4. 
> To ensure zero clinical risk, BloodConnect never determines blood compatibility or medical eligibility—that remains the exclusive authority of authorized blood centres. All donor locations are spatially obfuscated to ~1.1 km to guarantee privacy under the DPDP Act."

---

## 2. Key Technical Viva Questions & Strong Answers

### Q1: Why not just use e-RaktKosh?
**Answer:** e-RaktKosh is an inventory management system (MIS). It tracks blood bags already collected and stored in blood banks. BloodConnect does not track static shelf stock; it activates only when a confirmed stock shortage occurs to coordinate voluntary human donor mobilization, NGO volunteers, and regional transfusion centers under time-critical deadlines.

### Q2: Why is `evaluateNextStage` written as a pure function?
**Answer:** In mission-critical healthcare systems, deterministic predictability is mandatory. A pure function has zero side effects, zero I/O, and zero database dependencies. Given identical inputs (`caseState`, `rule`, `responses`, `currentTime`), it always outputs the exact same transition decision. This makes it 100% unit-testable and eliminates race conditions.

### Q3: How do you handle race conditions when two donors respond at the exact same millisecond?
**Answer:** We enforce two layers of protection:
1. **Database Row Locks:** In PostgreSQL, transitions run within a transaction with `SELECT ... FOR UPDATE` on the case row.
2. **Optimistic Versioning:** Every case record has an integer `version` field. An update checks `WHERE id = :id AND version = :currentVersion`. If another process modified the row, the transaction aborts and retries.

### Q4: How does BloodConnect protect donor privacy?
**Answer:**
1. Exact street addresses are never collected or stored.
2. Geolocation coordinates are mathematically rounded to 2 decimal places (`Math.round(val * 100) / 100`), which limits spatial accuracy to approx 1.1 km.
3. Coordinates are tokenized into grid cells (e.g. `GRID_12.98_77.60`).
4. Hospitals only see aggregate numbers ("3 potential donors responded"), never donor identities or phone numbers.

### Q5: What happens if the server crashes while an escalation timer is running?
**Answer:** Escalation timers store their deadline in the database as `nextStageDueAt`. A background timer recovery sweeper executes every 30 seconds, scanning for active cases where `nextStageDueAt <= NOW()`. When the server boots back up, any overdue timer is automatically recovered and executed.

---

## 3. Demo Walkthrough Strategy for Examiners
1. **Log in as Hospital (`hospital.victoria@bloodconnect.org`):**
   - Submit an emergency request for 3 units of O+ Whole Blood to Red Cross Blood Centre.
   - Show that the hospital view immediately shows "Submitted".
2. **Log in as Blood Centre (`centre.redcross@bloodconnect.org`):**
   - Show the Verification Queue.
   - Enter available stock = 1 unit. System calculates acute shortage = 2 units.
   - Confirm verification and activate the emergency case.
3. **Show Live Orchestration:**
   - Case enters Stage 1. Countdown timer starts ticking down from 10:00.
   - Stage 1 radius (~5 km) identifies registered potential donors in Bengaluru Central.
4. **Log in as Voluntary Donor (`donor@bloodconnect.org`):**
   - Show the live emergency alert in the donor drawer.
   - Click "I Can Help", select 30 minutes arrival, and check the mandatory clinical disclaimer.
5. **Return to Blood Centre Command Center:**
   - Show the donor appearing under "Willing to help, pending screening".
   - Click "Record Clinical Outcome" &rarr; Record `DONATED` (1 unit).
   - Show `unitsFulfilled` updating to 1/2.
   - Record second outcome &rarr; Show case automatically transitioning to `FULFILLED`!
6. **Log in as Admin (`admin@bloodconnect.org`):**
   - Show the Recharts analytics dashboard and export the tamper-proof CSV audit trail.
