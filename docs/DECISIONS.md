# Architectural Decision Records (ADRs)

This document records the foundational architectural decisions and engineering trade-offs in CivicLens.

---

## ADR 1: Deterministic Candidate Retrieval Preceding LLM

- **Status:** Accepted
- **Context:**
  When a citizen files a new report, the platform must determine if it describes an existing active issue. Passing the entire municipal database of thousands of tickets directly to an LLM context window causes astronomical token costs, unpredictable latencies, and high hallucination risk.
- **Decision:**
  Implement a deterministic, non-LLM candidate retrieval service (`services/issue_aggregation.py`) that filters open tickets using SQL queries:
  1. Active status (`NEW`, `TRIAGED`, `ASSIGNED`, `IN_PROGRESS`, `IN_REVIEW`)
  2. Category match
  3. Time window (default 30 days)
  4. Token Jaccard text similarity on addresses and descriptions
  Only the top 10 ranked candidates are passed to the Recurrence Agent.
- **Consequences:**
  - Token consumption per report reduced by over 95%.
  - LLM latency drops from $> 8\text{s}$ to $< 1.2\text{s}$.
  - LLM prompt remains compact, focused, and repeatable.

---

## ADR 2: Deterministic Priority Scoring Owned by Django Backend

- **Status:** Accepted
- **Context:**
  Municipal triage requires deterministic, auditable, and defendable priority scores. Relying on an LLM to generate numeric scores (e.g. "Rate this 1-100") yields non-deterministic drift where identical reports receive different scores on different runs.
- **Decision:**
  Django computes the authoritative priority score using a transparent, configurable mathematical formula:
  $$\text{Priority Score } (1\text{–}100) = \text{clamp}(0.45 \times \text{Severity} + 0.25 \times \text{Recurrence} + 0.15 \times \text{WardSensitivity} + 0.15 \times \text{Aging})$$
  The Priority Agent provides qualitative dispatch recommendations and explanations only. CheckConstraints in PostgreSQL enforce $1 \le \text{priority\_score} \le 100$.
- **Consequences:**
  - Fully auditable scores with granular JSON breakdowns stored in PostgreSQL.
  - Zero arbitrary numeric hallucination.
  - Weights can be adjusted centrally in `settings.PRIORITY_WEIGHTS` without prompt engineering.

---

## ADR 3: PostgreSQL-Backed Queue (`SKIP LOCKED`) vs Redis/Celery

- **Status:** Accepted
- **Context:**
  Celery with Redis introduces additional infrastructure daemons, connection brokers, serialization overhead, and significant local development friction on Windows environments.
- **Decision:**
  Utilize PostgreSQL's native `SELECT ... FOR UPDATE SKIP LOCKED` capability on the `ProcessingJob` table.
  Support two runner modes:
  1. `JOB_RUNNER=inline`: Runs synchronously in request transaction (ideal for zero-cost demo deployments).
  2. `JOB_RUNNER=worker`: Dedicated worker loop (`python manage.py run_worker`) with row-level locks and stale-lock recovery.
- **Consequences:**
  - Zero Redis requirement.
  - Full ACID transaction guarantees across jobs and issue updates.
  - Seamless local development on Windows without WSL or Docker.

---

## ADR 4: Same-Origin Next.js Proxy Rewrites vs Cross-Origin Cookies

- **Status:** Accepted
- **Context:**
  Cross-origin cookie management (frontend on Vercel, backend on Render) suffers from third-party cookie blocking in modern browsers (Safari ITP, Chrome Privacy Sandbox) and complex CORS/CSRF configurations.
- **Decision:**
  Configure Next.js App Router rewrites (`/api/:path*` $\to$ `https://backend/api/:path*`) so the browser treats API requests as same-origin. Session cookies and CSRF tokens work naturally.
- **Consequences:**
  - Eliminates cross-site cookie rejection.
  - Simplifies cookie security flags (`SameSite=Lax`, `Secure=True`).

---

## ADR 5: Strict PostgreSQL Database Enforcement (No SQLite)

- **Status:** Accepted
- **Context:**
  SQLite lacks essential production features required by CivicLens:
  - Concurrent row-level locking (`SKIP LOCKED`)
  - Native JSONB querying and indexing
  - Full text search / vector extension compatibility (`pgvector`)
  - Strict data type constraints across threads
- **Decision:**
  PostgreSQL is enforced as the sole application database. The backend settings explicitly check `DATABASE_URL` and fail loudly on startup if it is missing or contains `sqlite`.
- **Consequences:**
  - Parity between development and production environments.
  - Complete support for concurrent transactions and atomic issue merging.
