# CivicLens REST API Specification

CivicLens provides a typed, OpenAPI 3.0-compliant REST API powered by Django REST Framework and `drf-spectacular`.

---

## 1. Interactive Documentation & Schema Endpoints

| Resource | URL Path | Format / Description |
| :--- | :--- | :--- |
| **Interactive Swagger UI** | `/api/docs/` | Interactive API explorer to test requests directly |
| **ReDoc Documentation** | `/api/redoc/` | Clean reference documentation |
| **OpenAPI 3.0 YAML/JSON Schema** | `/api/schema/` | Raw schema for code generation & SDKs |
| **System & Database Health** | `/api/health/` | Verifies PostgreSQL connectivity (HTTP 200 or 503) |

---

## 2. Authentication & Headers

CivicLens supports dual authentication strategies:
1. **Session Authentication (Browser / Same-Origin):** Uses HttpOnly session cookies with CSRF token protection.
2. **Token Authentication (Mobile / External Clients):**
   ```http
   Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
   ```

---

## 3. Rate Throttling Limits

| Scope | Rate Limit | Applied To |
| :--- | :--- | :--- |
| `anon` | 60 requests / minute | Unauthenticated endpoints |
| `user` | 120 requests / minute | Authenticated citizens and officers |
| `report_submission` | 10 submissions / minute | POST `/api/reports/` |
| `auth_attempt` | 10 attempts / minute | POST `/api/auth/login/` and `/register/` |

---

## 4. Key API Endpoints Catalog

### A. Authentication (`/api/auth/`)
- `POST /api/auth/register/`: Register a new citizen account.
- `POST /api/auth/login/`: Authenticate using username/email and password. Returns Token and User profile.
- `POST /api/auth/logout/`: Invalidate session or delete auth token.
- `GET /api/auth/me/`: Retrieve current authenticated user profile, role, and assigned ward.

### B. Citizen Reports (`/api/reports/`)
- `GET /api/reports/`: List reports. Citizens receive only their own filed reports; Admins receive citywide reports. Supports pagination (`?page=1`).
- `POST /api/reports/`: Submit a new civic complaint. Triggers background/inline multi-agent processing pipeline.
  ```json
  {
    "title": "Severe pothole at Hospital Gate 4",
    "description": "Deep asphalt crater causing traffic backup on Metro Blvd.",
    "category": "Roads & Bridges",
    "address": "842 Metro Boulevard",
    "ward": "Ward 4 (Central Hospital & Metro Corridor)",
    "citizen_urgency": "HIGH",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
  ```
- `GET /api/reports/<id>/`: Retrieve report details with structured Gemini Listener & Recurrence outputs.

### C. Master Consolidated Issues (`/api/issues/`)
- `GET /api/issues/`: Query consolidated tickets with filters:
  - `?category=Roads & Bridges`
  - `?ward=Ward 4`
  - `?status=ASSIGNED`
  - `?priority=P1_CRITICAL`
  - `?search=Metro Blvd`
- `GET /api/issues/<id>/`: Detail view with clustered citizen reports, audit activity log, and comments.
- `POST /api/issues/<id>/update_status/`: *(Admin only)* Update operational status and reassign department.
  ```json
  {
    "status": "IN_PROGRESS",
    "assigned_department": "Public Works Department",
    "notes": "Crew dispatched with hot-mix asphalt asphalt paver."
  }
  ```
- `POST /api/issues/<id>/override_priority/`: *(Admin only)* Override priority score with mandatory reason.
  ```json
  {
    "priority_score": 95,
    "priority_tier": "P1_CRITICAL",
    "override_reason": "Emergency evacuation corridor designated for upcoming civic marathon."
  }
  ```
- `POST /api/issues/<id>/merge_into/`: *(Admin only)* Atomically merge duplicate source dockets into target ticket.
  ```json
  {
    "source_issue_ids": ["ISSUE-102", "ISSUE-103"],
    "merge_reason": "Identified as exact same bridge expansion joint."
  }
  ```
- `POST /api/issues/<id>/comments/`: Post internal officer notes or public updates.

### D. AI Processing & Review Queue (`/api/ai/`)
- `GET /api/ai/review-queue/`: *(Admin only)* List tickets flagged by the Recurrence Agent for human verification (confidence $< 0.70$).
- `POST /api/ai/review-queue/<id>/decision/`: *(Admin only)* Resolve triage item:
  - `MERGE`: Merge into target issue docket.
  - `CREATE_NEW`: Spawn independent ticket.
  - `DISMISS`: Reject non-actionable complaint.
- `POST /api/ai/jobs/<id>/retry/`: *(Admin only)* Retry a failed processing job.
- `GET /api/ai/monitor/`: Real-time agent latency, token usage, and processing success rate.

### E. Council Analytics (`/api/analytics/council/`)
- `GET /api/analytics/council/`: Real-time aggregated metrics:
  - Aggregation ratio (Total Reports / Master Issues)
  - Issues by category
  - Priority tier breakdown
  - Ward response heatmaps
  - Average resolution days
