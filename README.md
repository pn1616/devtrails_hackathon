# GigShield

**AI-Powered Parametric Income Protection for Gig Workers**  
Guidewire DEVTrails 2026

---

## The Problem

India has 15M+ gig delivery workers. Disruptions like extreme rain, heat, and platform outages cause 20-30% income loss every month. No income protection exists for them.

---

## What GigShield Does

Automatic parametric insurance that detects disruptions in real time and pays workers within 3 minutes. No forms. No waiting. No manual claims.

---

## How It Works

```
Trigger Detected  ->  Claim Auto-Created  ->  Fraud Scored  ->  Payout Sent  ->  Receipt
```

1. **Trigger Detection** - Rainfall, heat, or outage crosses threshold via live API
2. **Claim Creation** - Backend auto-generates a claim for the affected worker
3. **Fraud Check** - ML model scores the claim across 7 behavioral signals
4. **Decision** - Low risk auto-approves; high risk gets flagged for review
5. **Payout** - Razorpay transfer to worker UPI, under 3 minutes
6. **Receipt** - Downloadable proof with timestamp generated instantly

---

## GigShield vs Traditional Insurance

| Feature         | GigShield             | Traditional        |
|-----------------|-----------------------|--------------------|
| Claims          | Fully automatic       | Manual form        |
| Payout speed    | Under 3 minutes       | 3-7 days           |
| Fraud detection | ML, 7 signals + rings | Basic GPS check    |
| Pricing         | Weekly, dynamic       | Fixed monthly      |
| Coverage        | Earnings-linked       | Fixed sum          |

---

## ML Models

**Fraud Detection** - Gradient Boosting (scikit-learn)  
Scores claims on amount, location consistency, weather correlation, frequency, and timing.

**Premium Calculator** - XGBoost regression  
Recalculates each worker's weekly premium every Monday based on zone, rating, and tenure.

**Ring Detection** - Isolation Forest  
Identifies coordinated fraud clusters filing claims in synchronized bursts.

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React, Vite                   |
| Backend   | Node.js, Express              |
| ML        | Python, FastAPI, scikit-learn |
| Real-time | Socket.io                     |
| Payments  | Razorpay (Test Mode)          |

---

## Setup

**Prerequisites:** Node.js 18+, Python 3.9+, pip

```bash
# 1. ML Service
cd ml
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 2. Backend
cd backend
npm install && npm start

# 3. Frontend
cd frontend
npm install && npm run dev
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:5000      |
| ML Docs  | http://localhost:8000/docs |

---

## Demo Workers

| ID     | Name         | Platform         |
|--------|--------------|------------------|
| ZPT001 | Raju Kumar   | Zepto            |
| ZPT002 | Priya Sharma | Blinkit          |
| ZPT003 | Amit Verma   | Swiggy Instamart |

---

## Project Structure

```
devtrails_hackathon/
├── frontend/
├── backend/
├── ml/
├── models/
├── data/
└── README.md
```

---

---

## Pitch Deck

View the full GigShield pitch deck (PDF):

👉 [GigShield Pitch Deck](https://amritauniv-my.sharepoint.com/:b:/g/personal/am_sc_u4cse23039_am_students_amrita_edu/IQAFSzAnhQhTQJ3FRxElkl5NAXU0ETYGsxOl46RER8Rq7_8?e=PptwEd)

This deck includes:
- Problem & gig worker persona  
- Solution & trigger-based model  
- End-to-end flow  
- AI fraud architecture  
- Business model & pricing  
- Impact and roadmap  

---

Built for DEVTrails 2026
