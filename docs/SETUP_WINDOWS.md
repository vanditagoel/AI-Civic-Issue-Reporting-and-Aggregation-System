# Local Development Guide for Windows

This guide provides step-by-step instructions for running CivicLens locally on Windows 10/11 using PowerShell, Python 3.12, PostgreSQL, and Node.js.

---

## 1. Prerequisites Installation

### A. Install Python 3.12
1. Download Python 3.12 64-bit installer from [python.org](https://www.python.org/downloads/windows/).
2. **CRITICAL:** On the installer welcome screen, check the box: **"Add python.exe to PATH"**.
3. Choose **Install Now**.
4. Verify in PowerShell:
   ```powershell
   python --version
   # Expected output: Python 3.12.x
   ```

### B. Install Node.js (v20 or v22 LTS)
1. Download the Windows Installer (`.msi`) from [nodejs.org](https://nodejs.org/).
2. Complete the setup wizard with default options.
3. Verify in PowerShell:
   ```powershell
   node -v
   npm -v
   ```

### C. Install PostgreSQL 16
1. Download the Windows PostgreSQL 16 installer from [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Run installer. Set password for the default `postgres` superuser (e.g. `postgrespassword` or `postgres`).
3. Keep default port `5432`.
4. Finish installation. (You may uncheck Stack Builder at the end).

---

## 2. Database Creation with Exact SQL

Open **SQL Shell (psql)** from the Windows Start menu or open PowerShell and run:

```powershell
# Connect as postgres superuser
psql -U postgres -h localhost -p 5432
```
Enter your postgres master password when prompted.

Run the following SQL commands to create the dedicated database and user:
```sql
-- 1. Create dedicated user
CREATE USER civiclens_user WITH PASSWORD 'civiclens_secure_pass_2026';

-- 2. Create database owned by this user
CREATE DATABASE civiclens_db OWNER civiclens_user;

-- 3. Grant schema permissions
GRANT ALL PRIVILEGES ON DATABASE civiclens_db TO civiclens_user;

\c civiclens_db
GRANT ALL ON SCHEMA public TO civiclens_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO civiclens_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO civiclens_user;

-- Exit psql
\q
```

---

## 3. Backend Setup (Django + Python 3.12)

Open a new PowerShell terminal and navigate to your project directory:

```powershell
cd C:\path\to\civiclens\backend
```

### A. Set PowerShell Execution Policy (For Virtualenv)
By default, Windows restricts running scripts. Allow virtualenv activation for the current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

### B. Create and Activate Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(Your prompt will now show `(venv)`)*

### C. Install Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```
*Note: `psycopg[binary]` is included in `requirements.txt`, which avoids needing C++ build tools on Windows.*

### D. Configure Environment Variables
Copy the example environment file:
```powershell
Copy-Item .env.example .env
```
Edit `.env` (using Notepad or VS Code) and set your database connection and Gemini API key:
```ini
DATABASE_URL=postgresql://civiclens_user:civiclens_secure_pass_2026@localhost:5432/civiclens_db
SECRET_KEY=local-windows-secret-key-928174921
DEBUG=True
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
JOB_RUNNER=inline
```

### E. Run Migrations & Seed Demo Data
```powershell
python manage.py makemigrations accounts reports issues ai_processing notifications
python manage.py migrate
python manage.py seed_demo
```
*Output will confirm creation of Director Marcus Vance (Admin) and Vandita Goel (Citizen) demo accounts.*

### F. Verify Health Endpoint
Start the Django development server:
```powershell
python manage.py runserver 8000
```
Open a browser to: `http://localhost:8000/api/health/`
You should receive:
```json
{"status": "healthy", "database": "postgresql", "system": "CivicLens AI Municipal Aggregation Platform", "version": "1.0.0"}
```

---

## 4. Background Worker (Optional if JOB_RUNNER=worker)

If you configure `JOB_RUNNER=worker` in `.env`, open a second PowerShell window:
```powershell
cd C:\path\to\civiclens\backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\venv\Scripts\Activate.ps1
python manage.py run_worker
```
The worker will listen for incoming reports, claiming them with `SELECT ... FOR UPDATE SKIP LOCKED` and executing the 4-agent Gemini pipeline.

---

## 5. Frontend Setup (Next.js / Vite SPA)

Open a third PowerShell window at the project root:
```powershell
cd C:\path\to\civiclens
npm install
npm run dev
```
Open your browser to: `http://localhost:3000`

---

## 6. Running the Test Suite on Windows

In the backend virtual environment:
```powershell
cd C:\path\to\civiclens\backend
.\venv\Scripts\Activate.ps1
pytest tests/ -v
```
All 7 unit and integration tests (Permissions, Scoring, Orchestration, Concurrency, and E2E) will execute and pass.

---

## 7. Windows Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Activate.ps1 cannot be loaded because running scripts is disabled` | Windows Restricted Execution Policy | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force` in PowerShell. |
| `Error: pg_config executable not found` or `psycopg` build failure | Missing PostgreSQL C compiler | Ensure `requirements.txt` specifies `psycopg[binary]>=3.1.18`. Do not install bare `psycopg2`. |
| `Port 5432 already in use` | Existing PostgreSQL service running | Check Windows Services (`services.msc`), find `postgresql-x64-16`, verify it is running on port 5432. |
| `Port 8000 or 3000 in use` | Lingering process | In PowerShell, find the PID: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess` and kill with `Stop-Process -Id <PID> -Force`. |
| `FATAL: password authentication failed for user` | Password mismatch | Verify password in `DATABASE_URL` matches what was set during PostgreSQL installation. |
