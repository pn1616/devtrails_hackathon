# GigShield — Phase 3 Setup Guide

## Quick Start

You need three terminals running simultaneously.

**Terminal 1 — ML Service**

```bash
cd ml
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Runs at http://localhost:8000 — API docs at http://localhost:8000/docs

---

**Terminal 2 — Backend**

```bash
cd backend
npm install
npm start
```

Runs at http://localhost:5000

---

**Terminal 3 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173

---

## Health Check

Once all three are running, verify the ML service first:

```
http://localhost:8000/docs
```

Then confirm the backend is responding:

```bash
curl http://localhost:5000/api/dashboard/admin
```

If both return data, the system is ready.

---

## What Each Part Does

**ML Service (FastAPI, port 8000)**

| Endpoint           | Purpose                          |
|--------------------|----------------------------------|
| POST /ml/premium   | Dynamic premium calculation      |
| POST /ml/fraud-score | Fraud classification (0-1 score) |
| POST /ml/risk-score | Onboarding risk score           |
| POST /detect/ring  | Fraud cluster detection          |

**Backend (Node.js, port 5000)**

| Endpoint                      | Purpose                    |
|-------------------------------|----------------------------|
| POST /api/trigger/simulate    | Full pipeline entry point  |
| GET /api/dashboard/worker/:id | Worker dashboard data      |
| GET /api/dashboard/admin      | Admin metrics              |
| GET /api/receipt/:claimId     | Receipt download           |
| POST /api/autopay/simulate    | Payout simulation          |

**Frontend (React + Vite, port 5173)**

Covers the full user journey: landing page, mock OAuth login, plan selection with AI pricing, worker dashboard with real-time alerts, the simulation pipeline, and the admin metrics panel.

---


## Troubleshooting

**"Data unavailable" on the frontend**

Restart the backend and hard-refresh the browser:

```bash
Ctrl + C
cd backend
npm start
```

Then `Ctrl + Shift + R` in the browser.

**ML errors or missing scores**

Check that http://localhost:8000/docs loads correctly. If not, re-run the ML service setup from Terminal 1.

---

## Note

The backend and ML service must both be running for the full pipeline to work. The frontend alone will load but fraud scoring and payouts will not function without them.