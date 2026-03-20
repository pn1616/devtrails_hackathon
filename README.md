# GigShield
### AI-Powered Parametric Income Protection for Gig Workers

> **Guidewire DEVTrails 2026 — Hackathon Submission**
- Persona: Q-Commerce Delivery Partners (Zepto · Blinkit · Swiggy Instamart)
- Platform: Web and Mobile Application | Coverage: Income Loss ONLY | Pricing: Weekly

Gig workers don't need charity. They need predictable income protection. GigShield delivers that automatically, instantly, and fairly.

---

## The Problem

India has **15+ million platform-based gig delivery workers**. External disruptions — extreme weather, platform outages, curfews, AQI emergencies — cause 20–30% income loss monthly. Zero income protection exists. When disruptions hit, workers bear 100% of the financial loss with no safety net.

**Meet Raju** — a 27-year-old delivery partner for Zepto in Pune. He earns ₹700–₹900/day completing 25–35 quick-commerce deliveries. He has no formal employment, no PF, no ESI. On a single day of extreme rainfall, he loses ₹560. Over a monsoon season, he loses ₹4,200–₹6,800, with no savings buffer and informal loans at 3–5% monthly interest.

GigShield ensures he gets paid when he can't work.

---

## The Solution

GigShield is an **AI-enabled parametric income insurance platform** that automatically detects external disruptions using real-time data feeds and instantly pays lost wages to gig workers — no claim forms, no waiting, no paperwork.

GigShield automatically:
- Detects disruptions using real-time data
- Verifies events via multiple independent sources
- Triggers instant payouts to the worker's UPI

Workers subscribe weekly and are covered the moment they log in to work.

### What Makes GigShield Unique

| Feature | GigShield | Typical Competitors |
|---|---|---|
| Trigger granularity | Pin-code level hyperlocal | City-wide averages |
| Claim process | Zero-touch, fully automatic | Manual form submission |
| Payout speed | < 3 minutes | 3–7 business days |
| Fraud detection | Multi-signal 7-dimension ML + ring detection | Basic GPS coordinate check |
| Coverage model | Earnings-linked dynamic (40% of last week) | Fixed sum insured |
| Platform outage coverage | Yes (unique) | No |
| Pricing structure | Weekly + AI-personalized per worker | Monthly/annual, fixed rate |
| Syndicate defense | Coordinated ring detection model | Not addressed |

---

## Platform Integration & Autopay

### How Onboarding Actually Works

GigShield integrates directly with the delivery platform's existing worker database. Workers authenticate using the same credentials they already use for Zepto, Blinkit, or Swiggy Instamart — no separate registration, no manual data entry.

```
Worker taps "Connect with Zepto"
        |
OAuth handshake with platform
        |
GigShield pulls verified profile:
  - Worker ID and name
  - Last 4 weeks of earnings
  - Active operating zones and pin-codes
  - Platform rating
  - UPI ID on file
        |
Worker sees pre-filled profile + recommended plan
        |
Selects Basic / Pro / Elite Shield
        |
Confirms UPI autopay mandate (Razorpay)
        |
Coverage starts immediately
```

Total onboarding time: under 2 minutes. No forms. No manual entry.

### The Weekly Autopay Loop

Every Sunday night an automated batch job runs across all active policies:

1. Pulls last week's verified earnings directly from the platform database
2. Recalculates dynamic coverage amount (`40% x last week's earnings`, capped at plan maximum)
3. Recalculates adjusted premium using the 5 AI risk multipliers
4. Charges the worker's UPI via the standing autopay mandate
5. Updates the policy for the coming week
6. Sends one confirmation SMS

The worker wakes up Monday morning already covered. They did nothing.

**If the UPI mandate fails:** coverage pauses — not cancels — for 48 hours with a single retry notification. If payment clears within 48 hours, coverage resumes with no gap and no re-enrollment required.

### What Platform Integration Unlocks

| Data Point | Without Integration | With Integration |
|---|---|---|
| Earnings data | Manual 4-week entry by worker | Pulled automatically every week |
| Zone and pin-code | Worker self-reported | Live from actual delivery activity |
| Platform rating | Static at onboarding | Updated in real time, premium adjusts |
| Shift activity | Inferred | Verified order history — fraud signals become live data |
| UPI details | Worker-entered | Already on file with platform |

### Mock Integration (Phase 1)

Zepto, Blinkit, and Swiggy do not expose public APIs. For Phase 1, GigShield includes a mock platform API that returns realistic worker data in the exact format a live integration would use. The authentication flow, data schema, and autopay logic are production-identical — only the data source is synthetic.

The mock API is documented separately in `/mock-api/README.md`.

---

## Parametric Triggers

GigShield uses a 5-trigger stack. Triggers are fully data-driven and automatic — never self-reported.

| # | Trigger | Threshold | Data Source | Payout Level |
|---|---|---|---|---|
| 1 | Extreme Rainfall | >50mm/hr in worker's pin-code zone | OpenWeatherMap API + IMD backup | 100% of daily rate |
| 2 | Extreme Heat Index | Temperature >42°C combined with humidity | OpenWeatherMap API | 70% of daily rate |
| 3 | Severe Air Quality | AQI >300 (Severe+ category) | AQICN Free API | 60% of daily rate |
| 4 | Civil Disruption | Curfew/strike keyword detection in worker's zone | NewsAPI + mock civic data feed | 100% of daily rate |
| 5 | Platform Outage | Zepto/Blinkit delivery app downtime >45 minutes | Mock platform uptime API | 80% of daily rate |

Each trigger uses a **3-layer verification** system (primary API → secondary source cross-validation → platform delivery pause echo). Multiple simultaneous triggers apply the **single highest payout rate** — no double-dipping.

---

## Weekly Premium & Coverage Plans

| Plan | Weekly Premium | Daily Coverage | Max Weekly Payout | Eligibility |
|---|---|---|---|---|
| Basic Shield | ₹29/week | ₹250/disruption day | ₹1,000 | New workers (0–6 months) |
| Pro Shield | ₹59/week | ₹450/disruption day | ₹2,000 | Active workers (6m+, rating 3.5+) |
| Elite Shield | ₹99/week | ₹750/disruption day | ₹3,500 | Top workers (1yr+, rating 4.5+) |

### Earnings-Linked Dynamic Coverage

Instead of a fixed sum insured, coverage scales to what the worker **actually earned last week**:

```
Weekly Coverage = Min(Plan Maximum, 40% x Last Week's Verified Platform Earnings)
```

### AI-Driven Premium Calculation

Premiums are recalculated every Monday using 5 risk multipliers:
- **Zone Risk Score** — historical disruption frequency (0.8x–1.4x)
- **Worker Tenure** — up to 15% discount at 12 months
- **Platform Rating** — 4.5+ stars earns 10% discount
- **Seasonal Risk Index** — monsoon +15%, winter -10%
- **Claim History Loyalty** — 6 consecutive clean months earns up to 20% discount

---

## Workflow

1. Worker connects platform account via OAuth — profile auto-populated from employer database
2. Selects weekly plan and confirms UPI autopay mandate once
3. System monitors real-time conditions across all active worker zones every 5 minutes
4. Trigger threshold crossed — cross-verified across multiple independent data sources
5. Fraud score calculated using 7-dimension behavioral signals
6. Payout sent instantly to worker's UPI — under 3 minutes end to end

---

## AI/ML Integration

### Model 1 — Dynamic Premium Calculator
**Type:** Gradient Boosted Regression (XGBoost)

Inputs: zone disruption history, worker tenure, platform rating, last 4-week earnings, seasonal risk index, claim history, shift hours.

### Model 2 — Fraud Detection Engine
**Type:** Ensemble — Isolation Forest + Gradient Boosted Classifier

7-dimension signal scoring across:
- GPS coordinates + motion sensor data
- Network type signals (WiFi vs 4G)
- Platform activity logs
- Claim timing patterns
- Cohort and ring signals
- Device fingerprint
- Historical claim behavior

### Model 3 — Churn & Retention Predictor
**Type:** Logistic Regression / Random Forest Classifier

Identifies workers likely to lapse and triggers proactive retention — loyalty discount reminders, upcoming disruption forecasts, renewal nudges.

> **Phase 1 scope:** Mock ML output with synthetic data. Real model training begins in Phase 2.

---

## Adversarial Defense & Anti-Spoofing

A coordinated syndicate of 500+ delivery workers has been documented exploiting a competing parametric platform via GPS-spoofing apps. GigShield's architecture was designed from first principles to defeat this.

### The Core Insight

> A genuine delivery worker caught in a storm was **actively working** moments before the disruption. A fraudster was **never working**. We don't just check WHERE the worker is — we check WHAT they were doing.

### Fraud Scenarios Covered

- GPS spoofing apps faking field location from home
- Fake inactivity claims — worker never logged activity before filing
- Bot-based claim bursts — automated scripts firing at trigger detection
- Coordinated fraud rings — Telegram-organized syndicate attacks

### Detection Strategy

**Behavioral Verification** — was the worker actively taking orders within 90 minutes of the disruption?

**Sensor Fusion** — GPS cross-referenced with accelerometer and gyroscope. Spoofing apps fake coordinates but cannot simultaneously fake motion sensor data.

**Network Validation** — home WiFi detected during a field emergency claim is an immediate red flag.

**Claim Timing Analysis** — claims filed within 2 seconds of trigger detection are flagged as automated scripts.

### Ring Detection Signals

- Claim burst detection — 30+ claims in 5 minutes from the same pin-code
- Device fingerprint deduplication — multiple accounts per IMEI blocked immediately
- Social graph fingerprinting — shared registration date, referral code, zone, and filing time
- Behavioral cohort spike — synchronized app opens before a claim wave

### 3-Tier Claim Handling

| Tier | Fraud Score | Decision | Timeline |
|---|---|---|---|
| Green Zone | 0.00–0.30 | Auto-approve | < 3 minutes |
| Amber Zone | 0.31–0.69 | Soft flag, background check; first-time Amber auto-approved | 2–4 hours |
| Red Zone | 0.70–1.00 | Hold for human review; one-tap appeal option | 24–48 hours |

**UX philosophy:** The word "fraud" never appears in any worker-facing message. First suspicious claim is still approved. Appeal is a single tap. Worker dignity is non-negotiable.

---

## Dashboards

### Worker Dashboard (Mobile)

Designed to be glanceable in under 5 seconds between deliveries.

- Coverage status — active/inactive, plan name, expiry, weekly premium
- Earnings protected — this week vs last week
- Disruption alerts — live zone map with active trigger type and severity
- Payout history — every payout with date, trigger, amount, and processing time
- Claim status tracker — Green/Amber/Red with timeline, no accusatory language
- Risk score indicator — personal score with contributing factors
- Loyalty milestone — progress toward 6-month clean-claim discount
- Zone safety map — pin-code level disruption heat map for route planning

### Admin Dashboard (Web)

The insurer's real-time command center.

- Live operations overview — active policies, claims in last 24h, payouts today
- Loss ratio analytics — by week, trigger type, city zone, and plan tier
- Claim volume heatmap — geographic pin-code level density, filterable by trigger
- Fraud intelligence queue — Red Zone claims awaiting review, ring detection alerts
- Ring detection alerts — suspected coordinated fraud clusters with member list and evidence
- Predictive analytics — 7-day weather forecast + projected claim volume + projected payout liability
- Cohort performance — retention rate, churn risk workers, loyalty redemption rate
- Premium vs payout waterfall — weekly P&L visibility
- Regulatory compliance log — full audit trail with timestamps

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend (Web) | React.js + TypeScript + Tailwind CSS | Worker dashboard, onboarding, admin panel |
| Frontend (Mobile) | Flutter | Worker mobile app |
| Backend API | Node.js + Express.js | Shared APIs for web and mobile — policy management, claims, trigger monitoring |
| ML Services | Python + FastAPI + XGBoost + scikit-learn | Premium calculator, fraud scorer, churn predictor |
| Database | PostgreSQL (primary) + Redis (cache) + Firebase (mobile sync and auth) | Storage, real-time cache, mobile state |
| Real-Time Events | Socket.io / WebSockets | Live disruption alerts, instant payout notifications |
| Payments (Mock) | Razorpay Test Mode | Premium collection + payout simulation |
| Maps & Zones | Google Maps Platform API | Pin-code zone polygon mapping + risk heat maps |
| Hosting | Railway / Render / AWS EC2 | Scalable cloud deployment accessible via URL |
| CI/CD | GitHub Actions | Automated testing, linting, and deployment pipeline |

### External API Integrations

| API | Purpose | Triggers |
|---|---|---|
| OpenWeatherMap | Rainfall + heat index data | Triggers 1 & 2 |
| AQICN | Air Quality Index by zone | Trigger 3 |
| NewsAPI | Curfew/strike detection | Trigger 4 |
| Mock Platform API | Zepto/Blinkit delivery pause signal | Trigger 5 |
| Razorpay | Premium collection + payout | Payment layer |
| Google Maps | Pin-code zone polygon mapping | Zone risk scoring |

---

## Architecture Data Flow

```
External APIs
    └── Trigger Monitor Service (Node.js cron, every 5 min)
            └── Zone Alert Queue (Redis pub/sub)
                    └── Worker Policy Matcher (active policies in affected zone)
                            └── Claim Initiator Service
                                    └── Fraud Scoring Service (Python ML FastAPI)
                                            └── Decision Router (Green / Amber / Red)
                                                    └── Payout Service (Razorpay mock)
                                                    └── Notification Service (SMS + push)
                                                    └── PostgreSQL

Analytics Pipeline:
    PostgreSQL → Aggregation jobs (Node cron) → Dashboard API → React + Flutter dashboards
```

---

## Development Plan

| Phase | Weeks | Theme | Key Deliverables |
|---|---|---|---|
| Phase 1 | Mar 4–20 | Ideation & Foundation | This document. DB schema. UI wireframes. Synthetic data. Onboarding prototype. Premium calculator mock. GitHub README. |
| Phase 2 | Mar 21–Apr 4 | Automation & Protection | Full onboarding with platform OAuth. Policy management. ML v1 premium calculator. All 5 triggers live. ML fraud detection. Claims dashboard. 2-min demo video. |
| Phase 3 | Apr 5–17 | Scale & Optimise | Ring detection ML. Instant payout simulation. Full worker + admin dashboards. Predictive 7-day analytics. Flutter mobile app. Final pitch deck PDF. 5-min demo video. |

### Phase 1 Prototype Scope (Current Submission)

- [x] Landing page — GigShield branding, value proposition, Raju's story
- [x] Worker onboarding with mock platform OAuth flow
- [x] Interactive risk assessment — zone + profile → real-time risk score display
- [x] Weekly premium calculator — interactive sliders → dynamic premium output
- [x] Disruption trigger simulator — select a trigger → see automated claim and payout flow
- [x] Worker dashboard mockup — all 8 metric sections
- [x] Admin dashboard mockup — KPI cards, claims table, fraud queue

---

## Business Viability

**Target Market:**
- ~15 million gig delivery workers in India
- ~2.5 million Q-commerce workers (Zepto, Blinkit, Swiggy Instamart)
- ~1.2 million addressable (urban, smartphone-enabled)

**Unit Economics (Pro Shield — ₹59/week per worker):**

| P&L Item | Amount |
|---|---|
| Weekly Premium Collected | ₹59.00 |
| Expected Claim Payout | -₹28.13 |
| Fraud Loss Provision (3% budget) | -₹1.77 |
| Operational Cost | -₹8.00 |
| **Net Margin per Worker/Week** | **₹21.10 (35.8%)** |

At 1% market penetration (12,000 workers): **₹3.68 Crore annual premium revenue**
At 5% market penetration (60,000 workers): **₹18.4 Crore annual premium revenue**

Parametric insurance has near-zero claim administration cost because 94%+ of claims are auto-approved by ML with no human touch. The automation is the profit engine.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/gigshield.git
cd gigshield

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Install ML service dependencies
cd ../ml && pip install -r requirements.txt

# Start development servers
npm run dev
```

Environment variables required (see `.env.example`):

```
OPENWEATHER_API_KEY=
AQICN_API_KEY=
NEWS_API_KEY=
GOOGLE_MAPS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
DATABASE_URL=
REDIS_URL=
FIREBASE_PROJECT_ID=
```

---

## Coverage Scope — Golden Rules

| Rule | Commitment |
|---|---|
| Coverage Scope | Income loss ONLY. No vehicle repair, no health insurance, no accident medical bills — ever. |
| Pricing Model | Weekly premium structure aligned to gig worker pay cycle. No monthly or annual options. |
| Persona Focus | Q-Commerce delivery partners (Zepto, Blinkit, Swiggy Instamart) exclusively. |
| Trigger Type | External environmental/social disruptions only. Personal choice not to work is excluded. |

---

## License

This project was built for Guidewire DEVTrails 2026. Licensing terms to be determined post-hackathon.

---

*GigShield — Because when the storm hits, Raju shouldn't have to choose between safety and survival.*
