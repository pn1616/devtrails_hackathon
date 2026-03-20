#  GigShield
### AI-Powered Parametric Income Protection for Gig Workers

- **Persona:** Q-Commerce Delivery Partners (Zepto, Blinkit, Swiggy Instamart)
- **Platform:** Progressive Web App (PWA) — React.js + Node.js
- **Coverage:** Income Loss ONLY (no health, vehicle repair, or accident cover)
- **Pricing:** Weekly subscription model — aligned to gig worker pay cycle

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

1. Pulls last week's **verified earnings** from platform API
2. Recalculates **dynamic coverage** (40% of verified earnings, capped at plan maximum)
3. Recalculates **adjusted premium** (zone + rating + season multipliers)
4. Charges worker's UPI via **Razorpay standing mandate**
5. Updates policy for the coming week
6. Sends **one SMS**: "You're covered this week. ₹X coverage active."

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
|------|---------------|----------------|-------------------|-------------|
| Basic Shield | ₹29/week | ₹250/day | ₹1,000 | New workers (0–6 months) |
| Pro Shield | ₹59/week | ₹450/day | ₹2,000 | Active workers (6m+, 3.5★+) |
| Elite Shield | ₹99/week | ₹750/day | ₹3,500 | Top workers (1yr+, 4.5★+) |

### Earnings-Linked Dynamic Coverage

Instead of a fixed sum insured, coverage scales to what the worker **actually earned last week**:

```
Weekly Coverage = Min(Plan Maximum, 40% x Last Week's Verified Platform Earnings)
```

### AI-Based Premium Calculation

Premium is recalculated every Monday using 5 risk multipliers applied to the base plan price:

| Factor | Effect |
|--------|--------|
| Zone risk score | High flood-risk zones pay more (0.8×–1.4×) |
| Platform rating | 4.5★+ workers get 10% discount |
| Tenure | 12 months+ active = up to 15% discount |
| Seasonal risk | Monsoon season (Jun–Sep) = +15% |
| Claim history | 6 clean months = up to 20% loyalty discount |

**Raju's live example:** ₹59 base × 1.2 (zone) × 0.90 (rating) × 0.92 (tenure) × 1.15 (monsoon) = **₹65/week**

---

## Zero-Touch Payout Flow

| Stage | What Happens | Time |
|-------|-------------|------|
| Trigger detection | API crosses threshold in worker's zone | T + 0 sec |
| Cross-verification | Secondary source + platform echo confirms | T + 30 sec |
| Policy + activity check | Worker has active policy + was working recently (from platform data) | T + 45 sec |
| ML fraud score | 7-dimension behavioral scoring (0.0–1.0) | T + 60 sec |
| Auto-approve | Score <0.30 → payout initiated | T + 90 sec |
| UPI payout sent | Razorpay mock → worker's registered UPI | T + 2–3 min |
| Notification | SMS + push: "Disruption detected. ₹X credited." | T + 3 min |

**Target: Sub-3-minute payout. No forms. No waiting. No calls.**

---

## AI/ML Integration

### Model 1 — Dynamic Premium Calculator
- **Type:** Gradient Boosted Regression (XGBoost)
- **Inputs:** Verified zone disruption history, worker tenure, live platform rating, last 4-week verified earnings, seasonal index, claim history, shift hours
- **Output:** Personalized weekly premium — recalculated every Monday
- **Phase 1 status:** Mock output with synthetic data; live platform data in Phase 2

### Model 2 — Fraud Detection Engine
- **Type:** Ensemble — Isolation Forest + Gradient Boosted Classifier
- **Inputs:** GPS stability, accelerometer variance, network type (WiFi/4G), time-since-last-order (from platform), claim filing velocity, cohort spike score, device fingerprint hash
- **Output:** Fraud probability score 0.0–1.0 → routed to Green / Amber / Red
- **Phase 1 status:** Rule-based mock; full ML training on platform data in Phase 2

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

- Word **"fraud"** is NEVER shown to the worker
- First-time Amber flag = **auto-approved always**
- Single flag = no permanent penalty — resets after 90 clean days
- Appeal = one tap, optional location photo, no complex forms

---

## Dashboards

### Worker Dashboard
| Section | What It Shows |
|---------|--------------|
| Coverage Status | Active/inactive badge, plan name, weekly coverage amount, renewal date |
| This Week's Earnings | Daily earnings bar chart pulled from platform, week-to-date total |
| Disruption Alerts | Live zone map, active trigger type, severity, estimated duration |
| Payout History | Date, trigger, amount, processing time for every payout received |
| Claim Status Tracker | Green/Amber/Red live status of any in-progress claim |
| Loyalty Milestone | Progress bar toward 6-month clean claim loyalty discount |

### Admin / Insurer Dashboard
| Section | What It Shows |
|---------|--------------|
| Live Operations | Active policies, claims today, payouts today, workers in disruption zones right now |
| Loss Ratio Analytics | Loss ratio by week, trigger type, city zone, plan tier |
| Fraud Intelligence Queue | Red zone claims awaiting review, fraud score breakdown, ring detection alerts |
| Predictive Analytics | 7-day weather forecast + projected claim volume + payout liability |
| Trigger Calibration | Hit rate, false positive rate per trigger with threshold adjustment controls |

---

## Platform Choice — Why PWA

We chose a **Progressive Web App (PWA)** over a native mobile app for 4 clear reasons:

1. **No Play Store barrier** — Raju gets a WhatsApp link, opens it in Chrome, connected and insured in under 2 minutes. No download, no storage used on his already-full budget phone.
2. **Judges evaluate instantly** — Any judge opens the URL in their browser. No APK, no 3–7 day Play Store approval delay risking the submission deadline.
3. **All sensors available** — GPS (Geolocation API), motion (DeviceMotion API), WiFi vs 4G (Network Information API) — everything fraud detection needs is accessible via browser APIs.
4. **6-week timeline** — A proper Android app takes 8–10 weeks. PWA delivers a complete, polished product within the hackathon timeline.

> **Phase 3 roadmap:** Native Android app using React Native — 70% of PWA code is directly reusable.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js + TypeScript + Tailwind CSS | Worker dashboard, onboarding, admin panel |
| Backend | Node.js + Express.js | Policy management, claims processing, trigger monitoring |
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

### Market Size
- 15M+ gig delivery workers in India
- ~1.2M addressable Q-commerce workers (urban, smartphone-enabled)
- Annual premium revenue at 1% penetration: ₹3.68 Crore
- Annual premium revenue at 5% penetration: **₹18.4 Crore**

### Unit Economics — Pro Shield (₹59/week per worker)

| Item | Amount |
|------|--------|
| Weekly premium collected | ₹59.00 |
| Expected claim payout | −₹28.13 |
| Fraud loss provision (3% budget) | −₹1.77 |
| Operational cost (tech + support) | −₹8.00 |
| **Net margin per worker per week** | **₹21.10 (35.8%)** |

### Catastrophe Risk Management
- **Catastrophe reserve:** 40% of weekly profit saved → ₹3.7L reserve after 6 months
- **Geographic spread:** Workers across 5 cities — a city-level flood affects only 20% of the portfolio, not 100%
- **Reinsurance:** Partner insurer covers claims exceeding threshold — standard industry practice used by every insurance company
- **Monsoon surge pricing:** +15% premium Jun–Sep builds extra reserve exactly before the high-risk season

---

## Why GigShield Wins

| Feature | GigShield | Competitors |
|---------|-----------|-------------|
| Onboarding | 3 taps via platform OAuth | Manual registration form |
| Trigger granularity | Pin-code hyperlocal | City-wide averages |
| Claim process | Zero-touch automatic | Manual form submission |
| Payout speed | < 3 minutes | 3–7 business days |
| Earnings data | Verified from platform API | Self-reported by worker |
| Fraud detection | 7-dimension ML + ring detection + live platform data | Basic GPS check |
| Coverage model | Earnings-linked dynamic (real-time) | Fixed sum insured |
| Platform outage cover | Yes — Trigger 5 (unique) | No |
| Pricing | Weekly + AI-personalized | Monthly/annual fixed |
| Syndicate defense | Ring detection model | Not addressed |
| KYC | Face liveness detection (one-time) | None |

---

## License

This project was built for Guidewire DEVTrails 2026. Licensing terms to be determined post-hackathon.

---

*GigShield — Because when the storm hits, Raju shouldn't have to choose between safety and survival.*
