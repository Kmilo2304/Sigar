# SIGAR Backend

Backend API built with FastAPI and SQLAlchemy.

## 1) Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 2) Seeded default login

At first run, backend seeds one admin user:

- cedula: `1010101010`
- password: `SIGAR2026`

## 3) Optional demo telemetry data

To load sample data for dashboards:

```bash
cd backend
source .venv/bin/activate
python scripts/seed_demo_data.py
```

## 4) Useful endpoints

- `GET /health`
- `POST /api/auth/login`
- `POST /api/telemetry/readings`
- `GET /api/dashboard/summary`
- `GET /api/history/comparative?granularity=day`
- `GET /api/finance/summary`

## 5) Railway private DB config

Use only the Railway private domain in `DATABASE_URL` (internal network), for example:

`postgresql+psycopg://postgres:<PASSWORD>@<RAILWAY_PRIVATE_DOMAIN>:5432/railway?sslmode=require`

Optional:

- `API_PREFIX=/api`
- `PROJECT_NAME=SIGAR API`
- `APP_TIMEZONE=America/Bogota`
