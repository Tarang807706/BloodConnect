# Clinical Safety, Ethics & Privacy Constraints

BloodConnect was deliberately designed from the ground up to prevent medical liability, patient identification breaches, and donor exploitation.

---

## 1. The 10 Invariable Safety Rules

| # | Safety Rule | Technical Implementation |
|---|---|---|
| 1 | **Never declare a donor medically eligible** | Wording in UI, APIs, and emails strictly says "potential donor", "willing to help, pending screening". |
| 2 | **Never decide blood compatibility** | Zero compatibility tables, charts, or mixing heuristics exist in code or SQL. |
| 3 | **Never perform medical screening** | Screening, testing (HIV, Hepatitis, VDRL, Malaria, Hb), and phlebotomy are performed exclusively by authorized blood centres. |
| 4 | **Clinical authority strictly at authorized blood centres** | Only blood centre accounts can verify requests, record outcomes, or confirm collections. |
| 5 | **No person-to-person blood marketplace** | Peer-to-peer donor discovery or direct chat between patients and donors is prohibited. |
| 6 | **No commercialization, buying, or selling of blood** | Zero monetary fields, pricing attributes, or payment gateways exist anywhere in the codebase. |
| 7 | **Never expose exact donor home addresses** | Street addresses are never collected or stored in database tables. |
| 8 | **Use approximate location only (~1.1 km precision)** | Coordinates are mathematically rounded to 2 decimal places (`Math.round(val * 100) / 100`) and stored as grid cells. |
| 9 | **Sensitive data protection & no patient identifiers** | Emergency requests contain clinical ward context only (e.g. ICU Bed 4); no patient names, Aadhaar, or MRNs. |
| 10 | **Role-Based Access Control & Ownership Scoping** | Hospitals see aggregate counts only; donors see only their own alerts; blood centres access coordination data only for their assigned cases. |

---

## 2. Terminology & Wording Invariants
- **Approved Wording:** "potential donor", "willing to help, pending screening", "final eligibility is decided by the blood centre", "coordination requirement".
- **Prohibited Wording:** "eligible donor", "compatible donor", "matched donor", "safe donor", "guaranteed donor".

---

## 3. Statutory & Ethical Compliance
BloodConnect complies with:
- **National Blood Transfusion Council (NBTC) Guidelines (India)**
- **Drugs and Cosmetics Act, 1940 & Rules 1945 (Part XII-B: Blood Banks)**
- **Digital Personal Data Protection (DPDP) Act, 2023:** Geolocation privacy preservation via spatial obfuscation (~1.1 km grid precision).
