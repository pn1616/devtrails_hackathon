# GigShield — Phase 2 Setup Guide

## Quick Start (3 terminals)

### Terminal 1 — Backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### Terminal 2 — ML Service
```bash
cd ml
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Terminal 3 — Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

## What Each Part Does

### Backend (Node.js - port 5000)
- `GET /api/zepto/worker/:id` — Mock Zepto OAuth (returns worker profile)
- `POST /api/policy/create` — Create insurance policy
- `GET /api/policy/:workerId` — Get active policy
- `POST /api/trigger/simulate` — Simulate a disruption trigger
- `GET /api/claims/:workerId` — Get claim history
- `POST /api/autopay/simulate` — Run Sunday autopay batch job

### ML Service (Python FastAPI - port 8000)
- `POST /ml/premium` — Calculate AI-personalized weekly premium
- `POST /ml/fraud-score` — Score a claim (7 signals → 0.0-1.0)
- `POST /ml/risk-score` — Worker risk score during onboarding

### Frontend (React - port 3000)
- Landing page — Raju's story + stats
- OAuth Flow — "Connect with Zepto" mock authentication
- Plan Selection — AI premium calculator + plan cards
- Dashboard — Coverage status, earnings, alerts, payout history
- Claims Simulator — 5 triggers + LIVE FRAUD SCORE VISUALIZER
- Autopay Simulator — Sunday batch job animation

## The Unique Feature — Fraud Score Visualizer
When a claim is triggered, the app shows each of the 7 fraud signals
lighting up one by one with animations, contributing to a growing score,
then routing to Green/Amber/Red. This is built using algorithm
visualization techniques combined with ML fraud detection.

## Mock Workers Available
- ZPT001: Raju Kumar (Zepto, Kothrud Pune, ₹6500/week, 4.6★)
- ZPT002: Priya Sharma (Blinkit, Andheri Mumbai, ₹8200/week, 4.8★)
- ZPT003: Amit Verma (Swiggy Instamart, Koramangala Bangalore, ₹5800/week, 3.8★)

## Note on APIs
The app works WITHOUT the backend/ML running — it falls back to
mock data automatically. So you can demo the frontend alone if needed.
