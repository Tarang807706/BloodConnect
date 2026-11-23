# BloodConnect API Documentation (`/api/v1`)

All endpoints return a standardized JSON response envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "uuid",
    "pagination": { "total": 10, "page": 1, "limit": 20 }
  }
}
```

---

## 1. Authentication (`/api/v1/auth`)
- `POST /auth/register/donor`: Registers voluntary donor with approximate location.
- `POST /auth/login`: Authenticates user; returns 15-minute access token + 7-day rotating refresh token.
- `POST /auth/refresh`: Rotates refresh token; revokes token family if reuse detected.
- `POST /auth/logout`: Revokes active refresh token.
- `GET /auth/me`: Returns profile, role, and tenant organization details.

---

## 2. Organizations (`/api/v1/organizations`)
- `POST /organizations/register`: Registers hospital, blood centre, or NGO in `PENDING_APPROVAL` status.
- `GET /organizations/me`: Fetches profile of caller's organization.
- `GET /organizations/blood-centres`: Returns directory of authorized regional blood centres.

---

## 3. Donors (`/api/v1/donors`)
- `GET /donors/me`: Returns donor profile, approximate coordinates, and preferences.
- `PUT /donors/me`: Updates contact details and blood group.
- `PATCH /donors/me/availability`: Toggles emergency availability and temporary snooze date.
- `PUT /donors/me/preferences`: Sets maximum travel willingness radius (km) and quiet hours.
- `GET /donors/me/requests`: Fetches cases where this donor received mobilization alerts.
- `GET /donors/me/responses`: Returns personal response history.

---

## 4. Emergency Requests (`/api/v1/requests`)
- `POST /requests`: Hospital submits acute emergency blood requirement.
- `GET /requests`: Role-scoped list of requests (Hospital sees own, Centre sees assigned, Admin sees all).
- `GET /requests/:id`: Detailed request record with verification status and timeline.
- `POST /requests/:id/cancel`: Hospital cancels request with mandatory reason.
- `GET /requests/centre/pending`: Verification queue for blood centre staff.
- `POST /requests/:id/verify`: Blood centre enters shelf stock; computes acute shortage; confirms request.

---

## 5. Emergency Cases & State Machine (`/api/v1/cases`)
- `POST /cases/requests/:requestId/activate`: Blood centre activates coordination case from verified shortage.
- `GET /cases`: Role-filtered list of cases (Hospital sees aggregate numbers only; Centre sees full command center).
- `GET /cases/:id`: Detailed case view with current stage, timer countdown, and willing donors.
- `POST /cases/:id/respond`: Registered donor submits "I Can Help" or "Cannot Help".
- `POST /cases/:id/escalate`: Blood centre manual escalation to next stage.
- `POST /cases/:id/pause`: Pauses active timers with mandatory rationale.
- `POST /cases/:id/resume`: Resumes paused case to its previous active status.
- `POST /cases/:id/cancel`: Cancels coordination case.
- `POST /cases/:id/close`: Closes fulfilled or resolved case with closing notes.
- `POST /cases/:id/outcomes`: Blood centre records physical screening/donation outcome (`DONATED`, `DEFERRED`, `NOT_ATTENDED`).

---

## 6. NGO Volunteer Network (`/api/v1/ngo`)
- `GET /ngo/dashboard`: Summary of activated cases and active volunteer roster.
- `GET /ngo/cases`: Cases where this NGO was activated.
- `POST /ngo/cases/:id/activate`: Dispatches mobilization alert to volunteer roster.
- `GET /ngo/volunteers`: Lists registered volunteers.
- `POST /ngo/volunteers`: Adds volunteer with neighborhood and skills.
- `POST /ngo/volunteer-responses`: Records volunteer participation.

---

## 7. Real-Time Notifications (`/api/v1/notifications`)
- `GET /notifications`: Fetches user's notification drawer.
- `GET /notifications/unread-count`: Returns unread badge count.
- `PATCH /notifications/:id/read`: Marks notification as read.
- `POST /notifications/read-all`: Marks all notifications as read.
- `GET /notifications/stream`: Server-Sent Events (SSE) live connection with periodic heartbeats.

---

## 8. System Administration (`/api/v1/admin`)
- `GET /admin/users`: Lists registered platform users.
- `PATCH /admin/users/:id/status`: Activates or suspends user.
- `GET /admin/organizations`: Lists all organizations.
- `PATCH /admin/organizations/:id/verify`: Approves, suspends, or rejects organization license.
- `GET /admin/analytics/summary`: Aggregate metrics (urgency breakdown, stage-reach rate, latency).
- `GET /admin/audit-logs`: Forensic append-only audit trail with filtering.
- `GET /admin/audit-logs/export`: Exports complete audit logs as downloadable CSV.
- `GET /admin/stage-rules`: Returns configurable stage transition rules.
- `PUT /admin/stage-rules`: Updates radius, timeout, and response factor thresholds.
