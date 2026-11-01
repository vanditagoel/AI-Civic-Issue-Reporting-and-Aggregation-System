# CivicLens — AI-Powered Civic Issue Aggregation & Prioritization Platform

[![CI Pipeline](https://github.com/civiclens/civiclens/actions/workflows/ci.yml/badge.svg)](https://github.com/civiclens/civiclens/actions)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![PostgreSQL 16](https://img.shields.io/badge/database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![Google Gemini SDK](https://img.shields.io/badge/AI-Google%20Gen%20AI%20SDK-4285F4.svg)](https://ai.google.dev/)
[![DRF Spectacular](https://img.shields.io/badge/API-OpenAPI%203.0-green.svg)](/api/docs/)

CivicLens is a civic intelligence and municipal operations platform that aggregates scattered citizen notices, eliminates duplicates using multi-agent semantic clustering, and computes deterministic priority scores for urban repair dispatch.

---

## 1. Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (Next.js / Vite SPA)"]
        UI_Citizen["Citizen Portal (Report Filing, Ledger, Trackers)"]
        UI_Admin["Municipal Operations Desk (Triage, Dispatch, AI Pipeline)"]
    end

    subgraph API_Gateway["Django REST Framework Backend (Port 8000)"]
        Auth["Session / Token Auth & Throttling"]
        ReportsAPI["/api/reports/ (Intake)"]
        IssuesAPI["/api/issues/ (Work Orders & Merge)"]
        ReviewAPI["/api/ai/review-queue/ (Human Triage)"]
        HealthAPI["/api/health/ (DB Verification)"]
    end

    subgraph Job_Queue["PostgreSQL-Backed Queue"]
        DB_Queue[("ProcessingJob (SELECT FOR UPDATE SKIP LOCKED)")]
        Worker["Worker Service or Inline Runner"]
    end

    subgraph AI_Pipeline["4-Agent Gemini Intelligence Pipeline"]
        Agent1["1. Listener Agent (Intake Normalization & Schema Extraction)"]
        CandidateRetrieval["2. Candidate Retrieval (Deterministic Geospatial & Category Filter)"]
        Agent2["3. Recurrence Agent (Semantic Deduplication: Match / New / Review)"]
        Agent3["4. Severity Agent (Public Safety & Vulnerability Assessment)"]
        Agent4["5. Priority Engine (Authoritative Deterministic Formula + Priority Agent)"]
    end

    subgraph Storage["PostgreSQL Sole Application Database"]
        PG_Users[("accounts_user")]
        PG_Reports[("reports_report")]
        PG_Issues[("issues_consolidatedissue")]
        PG_Activities[("issues_issueactivity")]
        PG_Outputs[("ai_processing_agentoutput")]
    end

    UI_Citizen -->|POST /api/reports/| ReportsAPI
    UI_Admin -->|PATCH /api/issues/:id/| IssuesAPI
    UI_Admin -->|POST /api/ai/review-queue/:id/decision/| ReviewAPI
    
    ReportsAPI --> DB_Queue
    DB_Queue --> Worker
    Worker --> Agent1
    Agent1 --> CandidateRetrieval
    CandidateRetrieval --> Agent2
    Agent2 -->|Confidence < 0.70| ReviewAPI
    Agent2 -->|Match or New| Agent3
    Agent3 --> Agent4
    Agent4 --> PG_Issues
    Worker --> PG_Outputs
```

---

## 2. Key Features

- **4-Agent Gemini Pipeline:**
  1. **Listener Agent:** Standardizes unstructured community complaints into normalized work orders, extracting keywords, categories, and sentiment.
  2. **Candidate Retrieval (Deterministic):** Filters active tickets by ward, category, and text overlap (strictly non-LLM) before LLM evaluation.
  3. **Recurrence Agent:** Evaluates candidate tickets for physical duplication. Routes ambiguous cases ($< 0.70$ confidence) to human triage.
  4. **Severity Agent:** Audits public safety hazard, structural damage risk, and vulnerable population proximity (hospitals, schools, transit corridors).
  5. **Authoritative Priority Engine:** Computes a bounded, deterministic 1–100 score:
     $$\text{Priority Score } (1\text{–}100) = \text{clamp}(0.45 \times \text{Severity} + 0.25 \times \text{Recurrence} + 0.15 \times \text{WardSensitivity} + 0.15 \times \text{Aging})$$
- **Human-in-the-Loop Triage Desk:** Prevents destructive false-merges by giving operators 1-click controls to merge, split, or dismiss flagged tickets.
- **PostgreSQL Queue (Zero Redis):** Employs `SELECT ... FOR UPDATE SKIP LOCKED` on the `ProcessingJob` table with automatic stale-lock recovery.
- **Enterprise Role-Based Access Control:** Separate Citizen Ledger vs. Director Marcus Vance Operations Desk with session enforcement.

---

## 3. Demo Credentials

| Role | Username / Email | Password | Assigned Ward / Bureau |
| :--- | :--- | :--- | :--- |
| **Municipal Officer (Admin)** | `admin.dispatch@civiclens.gov` | `director2026` | Director Marcus Vance • Public Works Dispatch |
| **Citizen Contributor** | `goelvandita777@gmail.com` | `citizen2026` | Vandita Goel • Ward 4 (Hospital Corridor) |

---

## 4. Architectural Design Decisions

1. **Why Candidate Retrieval Precedes the LLM:**
   Passing an entire municipal database of thousands of tickets directly to an LLM is cost-prohibitive, introduces hallucinations, and hits context window bottlenecks. Deterministic filtering by category, active status, time window, and token overlap narrows the candidates to the top 10 relevant dockets.
2. **Why Django Owns the Priority Score:**
   LLMs are non-deterministic and can produce arbitrary numbers between runs. Django executes the mathematical formula, enforcing strict check constraints ($1 \le \text{score} \le 100$). The Priority Agent generates qualitative explanations and SLA recommendations only.
3. **Why a PostgreSQL-Backed Queue:**
   Eliminates external Redis/Celery infrastructure dependencies while supporting Windows development natively. Postgres `SKIP LOCKED` provides row-level locking without deadlocks.

---

## 5. Benchmark & Evaluation Results

The multi-agent pipeline was benchmarked against synthetic labeled ground-truth clusters:
- **Recurrence Precision:** 100.0%
- **Recurrence Recall:** 100.0%
- **False-Merge Rate:** 0.0%
- Detailed benchmark metrics and baseline comparisons: **[backend/evaluation/EVALUATION_RESULTS.md](backend/evaluation/EVALUATION_RESULTS.md)**.

---

## 6. Documentation Index

- **[docs/SETUP_WINDOWS.md](docs/SETUP_WINDOWS.md):** Complete step-by-step local development setup on Windows (PowerShell, Python 3.12, PostgreSQL, virtualenv, migrations, seeding, troubleshooting).
- **[docs/EXTERNAL_SETUP.md](docs/EXTERNAL_SETUP.md):** Production deployment checklist for Neon PostgreSQL, Google AI Studio Gemini API keys, Render backend deployment, and Vercel frontend.
- **[docs/API.md](docs/API.md):** OpenAPI 3.0 endpoint catalog, DRF throttling limits, and payload schemas.
- **[docs/DECISIONS.md](docs/DECISIONS.md):** Comprehensive technical decision records and architectural trade-offs.
