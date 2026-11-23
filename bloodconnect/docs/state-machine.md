# Emergency Response Orchestrator State Machine

The core technical innovation of BloodConnect is the **Emergency Response Orchestrator**, which manages the lifecycle of emergency cases from initial shortage confirmation through multi-stage escalation to clinical fulfillment.

---

## 1. Request Lifecycle
```
[DRAFT] --> [SUBMITTED] --> [VERIFICATION_PENDING]
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
    [VERIFIED]              [NO_SHORTAGE]              [REJECTED]
         |
         v
  (Activate Case)
```

1. **Hospital submits request** &rarr; Status becomes `SUBMITTED`.
2. **Assigned regional Blood Centre verifies stock:**
   - If stock is sufficient &rarr; `NO_SHORTAGE` (fulfilled from shelf stock).
   - If hospital request is invalid &rarr; `REJECTED`.
   - If confirmed acute shortage exists &rarr; `VERIFIED` (case coordination activated).

---

## 2. Case State Machine
```
   [ACTIVE_STAGE_1]  (Radius ~5 km, 10 min timer)
          |
          | (Timeout & insufficient willing responses)
          v
   [ACTIVE_STAGE_2]  (Expanded Radius ~15 km, 10 min timer)
          |
          | (Timeout & insufficient willing responses)
          v
   [NGO_ACTIVATED]   (Partner NGOs deployed, 15 min timer)
          |
          | (Timeout)
          v
      [ESCALATED]    (Secondary regional blood centres notified)
```

At any point in the active lifecycle:
- Any Active State &harr; **`PAUSED`** (stores `pausedFromStatus` so it can resume exactly where it was).
- Any Active State &rarr; **`FULFILLED`** (when blood centre records donations &ge; confirmed shortage units).
- Any Active State &rarr; **`PARTIALLY_FULFILLED`** (if requiredBy deadline arrives and some units were collected).
- Any Active State &rarr; **`EXPIRED`** (if requiredBy deadline passes with zero fulfillment).
- Any Active State &rarr; **`CANCELLED`** (manual cancellation by hospital or blood centre with mandatory audit reason).
- Terminal States (`FULFILLED`, `PARTIALLY_FULFILLED`, `EXPIRED`, `CANCELLED`) &rarr; **`CLOSED`**.

---

## 3. The Pure Evaluator Function (`evaluateNextStage`)
The evaluator is a **pure function with zero I/O**:
```typescript
function evaluateNextStage(
  caseState: EvaluatorCaseState,
  rule: EvaluatorStageRule,
  responses: EvaluatorDonorResponse[],
  currentTime: Date
): NextStageDecisionAction
```

### Transition Invariants:
1. **Clinical Fulfillment:** Only physical `DONATED` outcomes recorded by authorized blood centre staff increment `unitsFulfilled`. Willingness responses NEVER fulfill a case.
2. **Willingness Threshold:** A stage holds in place without auto-advancing if:
   $$\text{Willing Responses} \ge \lceil \text{Shortage Units} \times \text{minResponsesFactor} \rceil$$
3. **Recovery Sweeper:** If a server restarts or network interruptions occur, the timer recovery sweeper scans `nextStageDueAt` every 30 seconds and recovers pending timer jobs without loss.
