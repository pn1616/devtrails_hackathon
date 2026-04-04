# GigShield

### AI-Powered Parametric Income Protection for Gig Workers

**Guidewire DEVTrails 2026 - Hackathon Submission**

---

## Overview

India has over 15 million platform-based gig delivery workers. External disruptions like extreme weather, platform outages, and curfews cause 20-30% income loss every month, with no safety net in sight.

GigShield is an AI-enabled parametric income insurance platform that automatically detects disruptions using real-time data and pays lost wages to gig workers via UPI in under 3 minutes. No claim forms, no waiting, no paperwork.

- **Who it's for:** Q-Commerce delivery partners on Zepto, Blinkit, and Swiggy Instamart
- **What it covers:** Income loss only (not health, vehicle repair, or accidents)
- **How it's priced:** Weekly subscription, aligned to the gig worker pay cycle

---

## The Problem

Meet Raju, a 27-year-old delivery partner for Zepto in Pune. He earns between 700 and 900 rupees a day, has no formal employment, no PF, no ESI. A single day of extreme rainfall costs him 560 rupees. A full monsoon season costs him between 4,200 and 6,800 rupees, with no savings to fall back on.

GigShield ensures he gets paid when he cannot work.

---

## What Makes GigShield Different

| Feature | GigShield | Typical Competitors |
|---|---|---|
| Trigger granularity | Pin-code level hyperlocal | City-wide averages |
| Claim process | Zero-touch, fully automatic | Manual form submission |
| Payout speed | Under 3 minutes | 3-7 business days |
| Fraud detection | 7-dimension ML with ring detection | Basic GPS coordinate check |
| Coverage model | 40% of last week's verified earnings | Fixed sum insured |
| Platform outage coverage | Yes | No |
| Pricing | Weekly, AI-personalized per worker | Monthly or annual fixed rate |

---

## How It Works

Workers connect their Zepto, Blinkit, or Swiggy Instamart account via OAuth. GigShield pulls their verified profile, earnings history, operating zones, and UPI details. They pick a plan, confirm a Razorpay autopay mandate, and coverage starts immediately. The whole thing takes under 2 minutes with no manual data entry.

Every Sunday night, a batch job pulls the previous week's earnings, recalculates coverage and premium, charges the worker's UPI, and sends a single SMS confirmation. The worker wakes up Monday morning already covered.

When a disruption is detected, the payout flow runs automatically:

| Stage | What Happens | Time |
|---|---|---|
| Trigger detection | API crosses threshold in worker's zone | T + 0s |
| Cross-verification | Secondary source and platform echo confirm | T + 30s |
| Policy check | Active policy and recent work activity verified | T + 45s |
| Fraud score | 7-dimension behavioral scoring (0.0-1.0) | T + 60s |
| Auto-approve | Score below 0.30 triggers payout | T + 90s |
| UPI payout | Razorpay mock transfer to registered UPI | T + 2-3 min |

---

## Parametric Triggers

All triggers are data-driven and automatic, never self-reported.

| Trigger | Threshold | Data Source | Payout |
|---|---|---|---|
| Extreme Rainfall | Over 50mm/hr in worker's pin-code zone | OpenWeatherMap + IMD backup | 100% of daily rate |
| Extreme Heat Index | Temp above 42°C combined with high humidity | OpenWeatherMap | 70% of daily rate |
| Civil Disruption | Curfew or strike keyword detected in zone | NewsAPI + civic feed | 100% of daily rate |
| Platform Outage | App downtime over 45 minutes | Mock platform uptime API | 80% of daily rate |

Each trigger is verified across three independent sources before a payout is initiated. When multiple triggers fire at once, only the highest payout rate applies.

---

## Weekly Plans

| Plan | Weekly Premium | Daily Coverage | Max Weekly Payout | Eligibility |
|---|---|---|---|---|
| Basic Shield | Rs 29 | Rs 250 | Rs 1,000 | New workers, 0-6 months |
| Pro Shield | Rs 59 | Rs 450 | Rs 2,000 | Active workers, 6+ months, 3.5 stars and above |
| Elite Shield | Rs 99 | Rs 750 | Rs 3,500 | Top workers, 1+ year, 4.5 stars and above |

Premiums are recalculated every Monday using five multipliers: zone flood risk, platform rating, worker tenure, seasonal index, and claim history. A worker like Raju on the Pro plan would pay around Rs 65/week after all adjustments.

---

## AI and ML Models

**Dynamic Premium Calculator** uses XGBoost to produce a personalized weekly premium based on zone disruption history, tenure, platform rating, recent earnings, and seasonal factors.

**Fraud Detection Engine** is an ensemble of Isolation Forest and Gradient Boosted Classifier. It scores each claim across 7 behavioral signals including GPS stability, accelerometer variance, network type, claim velocity, and device fingerprint. The output routes claims to Green (auto-approve), Amber (soft flag), or Red (human review). The word "fraud" is never shown to a worker, and a first-time Amber flag is always auto-approved.

**Churn Predictor** uses Logistic Regression and Random Forest to identify workers likely to lapse, and triggers proactive retention through loyalty discount reminders and disruption forecasts.

---

## Fraud Defense

A coordinated syndicate of 500+ workers was documented exploiting GPS-spoofing on a competing parametric platform. GigShield was built to handle this from the start.

The core insight is simple: a genuine worker caught in a storm was actively taking orders before it hit. A fraudster was not. GigShield does not just check where a worker is. It checks what they were doing.

Detection covers GPS spoofing (cross-referenced against real motion sensor data), fake inactivity claims, bot-based claim bursts, and coordinated ring attacks. Claims flagged Red are held for human review with a single-tap appeal. Flags reset after 90 clean days.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| ML Services | Python, FastAPI, XGBoost, scikit-learn |
| Database | PostgreSQL, Redis, Firebase |
| Real-Time | Socket.io, WebSockets |
| Payments | Razorpay (Test Mode) |
| Maps | Google Maps Platform |
| CI/CD | GitHub Actions |

---

## Getting Started

The frontend works without the backend or ML service running. It falls back to mock data automatically, so you can demo it standalone.

**Prerequisites:** Node.js 18+, Python 3.9+, PostgreSQL (optional)

```bash
# Terminal 1 - Backend
cd backend && npm install && node server.js
# Runs on http://localhost:5000

# Terminal 2 - ML Service
cd ml && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000

# Terminal 3 - Frontend
cd frontend && npm install && npm start
# Runs on http://localhost:3000
```

---

## API Reference

**Backend (port 5000)**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/zepto/worker/:id` | Mock Zepto OAuth, returns worker profile |
| POST | `/api/policy/create` | Create insurance policy |
| GET | `/api/policy/:workerId` | Get active policy |
| POST | `/api/trigger/simulate` | Simulate a disruption trigger |
| GET | `/api/claims/:workerId` | Get claim history |
| POST | `/api/autopay/simulate` | Run Sunday autopay batch job |

**ML Service (port 8000)**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ml/premium` | Calculate personalized weekly premium |
| POST | `/ml/fraud-score` | Score a claim across 7 signals |
| POST | `/ml/risk-score` | Worker risk score at onboarding |

---

## Demo Workers

| Worker ID | Name | Platform | Zone | Earnings | Rating |
|---|---|---|---|---|---|
| ZPT001 | Raju Kumar | Zepto | Kothrud, Pune | Rs 6,500/week | 4.6 stars |
| ZPT002 | Priya Sharma | Blinkit | Andheri, Mumbai | Rs 8,200/week | 4.8 stars |
| ZPT003 | Amit Verma | Swiggy Instamart | Koramangala, Bangalore | Rs 5,800/week | 3.8 stars |

---

## Project Structure

```
devtrails_hackathon/
├── frontend/    # React PWA (TypeScript + Tailwind)
├── backend/     # Node.js + Express API
├── ml/          # Python FastAPI ML services
├── README.md
└── SETUP.md
```

---
Thank you!