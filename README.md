# GigShield
### AI-Powered Parametric Income Protection for Gig Workers

**Guidewire DEVTrails 2026 - Hackathon Submission**

Persona: Q-Commerce Delivery Partners (Zepto, Blinkit, Swiggy Instamart)
Platform: Progressive Web App (PWA) built with React.js and Node.js
Coverage: Income Loss ONLY (no health, vehicle repair, or accident cover)
Pricing: Weekly subscription model, aligned to the gig worker pay cycle

Gig workers don't need charity. They need predictable income protection. GigShield delivers that automatically, instantly, and fairly.

---

## The Problem

India has over 15 million platform-based gig delivery workers. External disruptions like extreme weather, platform outages, curfews, and AQI emergencies cause 20 to 30 percent income loss every month. No income protection exists for these workers. When disruptions hit, they bear 100 percent of the financial loss with nothing to fall back on.

Meet Raju, a 27-year-old delivery partner for Zepto in Pune. He earns between 700 and 900 rupees a day completing 25 to 35 quick-commerce deliveries. He has no formal employment, no PF, no ESI. On a single day of extreme rainfall, he loses 560 rupees. Over a monsoon season, he loses between 4,200 and 6,800 rupees, with no savings buffer and informal loans charging 3 to 5 percent monthly interest.

GigShield ensures he gets paid when he cannot work.

---

## The Solution

GigShield is an AI-enabled parametric income insurance platform that automatically detects external disruptions using real-time data feeds and instantly pays lost wages to gig workers. No claim forms, no waiting, no paperwork.

GigShield automatically detects disruptions using real-time data, verifies events via multiple independent sources, and triggers instant payouts to the worker's UPI. Workers subscribe weekly and are covered the moment they log in to work.

### What Makes GigShield Different

| Feature | GigShield | Typical Competitors |
|---|---|---|
| Trigger granularity | Pin-code level hyperlocal | City-wide averages |
| Claim process | Zero-touch, fully automatic | Manual form submission |
| Payout speed | Under 3 minutes | 3 to 7 business days |
| Fraud detection | Multi-signal 7-dimension ML with ring detection | Basic GPS coordinate check |
| Coverage model | Earnings-linked dynamic, 40% of last week | Fixed sum insured |
| Platform outage coverage | Yes, unique to GigShield | No |
| Pricing structure | Weekly and AI-personalized per worker | Monthly or annual fixed rate |
| Syndicate defense | Coordinated ring detection model | Not addressed |
| KYC | Face liveness detection, one time | None |

---

## Platform Integration and Autopay

### How Onboarding Works

GigShield integrates directly with the delivery platform's existing worker database. Workers authenticate using the same credentials they already use for Zepto, Blinkit, or Swiggy Instamart. No separate registration, no manual data entry.

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
Worker sees pre-filled profile and recommended plan
        |
Selects Basic, Pro, or Elite Shield
        |
Confirms UPI autopay mandate via Razorpay
        |
Coverage starts immediately
```

Total onboarding time: under 2 minutes. No forms. No manual entry.

### The Weekly Autopay Loop

Every Sunday night an automated batch job runs across all active policies. It pulls last week's verified earnings from the platform API, recalculates dynamic coverage at 40 percent of verified earnings capped at the plan maximum, recalculates the adjusted premium using zone, rating, and season multipliers, charges the worker's UPI via the Razorpay standing mandate, updates the policy for the coming week, and sends one SMS confirming coverage and the active coverage amount.

The worker wakes up Monday morning already covered. They did nothing.

If the UPI mandate fails, coverage pauses rather than cancels for 48 hours with a single retry notification. If payment clears within that window, coverage resumes with no gap and no re-enrollment required.

### What Platform Integration Unlocks

| Data Point | Without Integration | With Integration |
|---|---|---|
| Earnings data | Manual 4-week entry by worker | Pulled automatically every week |
| Zone and pin-code | Worker self-reported | Live from actual delivery activity |
| Platform rating | Static at onboarding | Updated in real time, premium adjusts |
| Shift activity | Inferred | Verified order history feeds directly into fraud signals |
| UPI details | Worker-entered | Already on file with the platform |

### Mock Integration for Phase 1

Zepto, Blinkit, and Swiggy do not expose public APIs. For Phase 1, GigShield includes a mock platform API that returns realistic worker data in the exact format a live integration would use. The authentication flow, data schema, and autopay logic are production-identical. Only the data source is synthetic.

The mock API is documented separately in `/mock-api/README.md`.

---

## Parametric Triggers

GigShield uses a 5-trigger stack. Triggers are fully data-driven and automatic, never self-reported.

| # | Trigger | Threshold | Data Source | Payout Level |
|---|---|---|---|---|
| 1 | Extreme Rainfall | Over 50mm per hour in worker's pin-code zone | OpenWeatherMap API with IMD backup | 100% of daily rate |
| 2 | Extreme Heat Index | Temperature above 42 degrees combined with humidity | OpenWeatherMap API | 70% of daily rate |
| 3 | Severe Air Quality | AQI above 300, Severe category | AQICN Free API | 60% of daily rate |
| 4 | Civil Disruption | Curfew or strike keyword detection in worker's zone | NewsAPI with mock civic data feed | 100% of daily rate |
| 5 | Platform Outage | Zepto or Blinkit delivery app downtime over 45 minutes | Mock platform uptime API | 80% of daily rate |

Each trigger uses a 3-layer verification system: primary API confirms the threshold, a secondary source cross-validates to eliminate false positives, and the platform delivery pause acts as a final confirmation signal. When multiple triggers fire simultaneously, only the single highest payout rate applies. No double-dipping.

---

## Weekly Premium and Coverage Plans

| Plan | Weekly Premium | Daily Coverage | Max Weekly Payout | Eligibility |
|---|---|---|---|---|
| Basic Shield | Rs 29 per week | Rs 250 per disruption day | Rs 1,000 | New workers, 0 to 6 months |
| Pro Shield | Rs 59 per week | Rs 450 per disruption day | Rs 2,000 | Active workers, 6 months or more, rated 3.5 stars or above |
| Elite Shield | Rs 99 per week | Rs 750 per disruption day | Rs 3,500 | Top workers, 1 year or more, rated 4.5 stars or above |

### Earnings-Linked Dynamic Coverage

Instead of a fixed sum insured, coverage scales to what the worker actually earned last week:

```
Weekly Coverage = Min(Plan Maximum, 40% of Last Week's Verified Platform Earnings)
```

### AI-Based Premium Calculation

Premium is recalculated every Monday using 5 risk multipliers applied to the base plan price.

| Factor | Effect |
|---|---|
| Zone risk score | High flood-risk zones pay more, between 0.8x and 1.4x |
| Platform rating | Workers rated 4.5 stars or above get a 10% discount |
| Tenure | 12 months or more active earns up to a 15% discount |
| Seasonal risk | Monsoon season from June to September adds 15% |
| Claim history | 6 clean months earns up to a 20% loyalty discount |

Live example for Raju: Rs 59 base, multiplied by 1.2 for zone risk, 0.90 for his rating, 0.92 for his tenure, and 1.15 for monsoon season, comes to Rs 65 per week.

---

## Zero-Touch Payout Flow

| Stage | What Happens | Time |
|---|---|---|
| Trigger detection | API crosses threshold in worker's zone | T + 0 seconds |
| Cross-verification | Secondary source and platform echo confirms | T + 30 seconds |
| Policy and activity check | Worker has active policy and was working recently, confirmed via platform data | T + 45 seconds |
| ML fraud score | 7-dimension behavioral scoring produces a score from 0.0 to 1.0 | T + 60 seconds |
| Auto-approve | Score below 0.30 triggers payout initiation | T + 90 seconds |
| UPI payout sent | Razorpay mock transfers to worker's registered UPI | T + 2 to 3 minutes |
| Notification | SMS and push: "Disruption detected. Rs X credited." | T + 3 minutes |

Target: sub-3-minute payout. No forms, no waiting, no calls.

---

## AI and ML Integration

### Model 1 - Dynamic Premium Calculator

Type: Gradient Boosted Regression using XGBoost

Inputs include verified zone disruption history, worker tenure, live platform rating, last 4 weeks of verified earnings, seasonal index, claim history, and shift hours. Output is a personalized weekly premium recalculated every Monday. Phase 1 uses mock output with synthetic data. Live platform data feeds in from Phase 2 onward.

### Model 2 - Fraud Detection Engine

Type: Ensemble combining Isolation Forest and Gradient Boosted Classifier

Inputs include GPS stability, accelerometer variance, network type (WiFi vs 4G), time since last order pulled from the platform, claim filing velocity, cohort spike score, and device fingerprint hash. Output is a fraud probability score from 0.0 to 1.0, which routes the claim to Green, Amber, or Red handling. Phase 1 uses a rule-based mock. Full ML training on platform data begins in Phase 2.

### Model 3 - Churn and Retention Predictor

Type: Logistic Regression and Random Forest Classifier

Identifies workers likely to lapse and triggers proactive retention through loyalty discount reminders, upcoming disruption forecasts, and renewal nudges. Phase 1 scope uses mock ML output with synthetic data. Real model training begins in Phase 2.

---

## Adversarial Defense and Anti-Spoofing

A coordinated syndicate of over 500 delivery workers has been documented exploiting a competing parametric platform via GPS-spoofing apps. GigShield's architecture was designed from first principles to defeat this. Simple GPS verification is not enough, and GigShield never relied on it.

### The Core Insight

A genuine delivery worker caught in a storm was actively working moments before the disruption. A fraudster was never working. GigShield does not just check where the worker is. It checks what they were doing.

### Fraud Scenarios Covered

- GPS spoofing apps faking a field location from home
- Fake inactivity claims where the worker never logged any activity before filing
- Bot-based claim bursts using automated scripts firing at the moment of trigger detection
- Coordinated fraud rings organized via Telegram carrying out syndicate attacks

### Detection Strategy

Behavioral verification checks whether the worker was actively taking orders within 90 minutes of the disruption. Sensor fusion cross-references GPS with accelerometer and gyroscope data, because spoofing apps fake coordinates but cannot simultaneously fake motion sensor data. Network validation flags home WiFi detected during a supposed field emergency as an immediate red flag. Claim timing analysis flags any claim filed within 2 seconds of trigger detection as a likely automated script.

### Ring Detection Signals

- Claim burst detection: 30 or more claims in 5 minutes from the same pin-code
- Device fingerprint deduplication: multiple accounts per IMEI are blocked immediately
- Social graph fingerprinting: shared registration date, referral code, zone, and filing time
- Behavioral cohort spike: synchronized app opens before a claim wave

### 3-Tier Claim Handling

| Tier | Fraud Score | Decision | Timeline |
|---|---|---|---|
| Green Zone | 0.00 to 0.30 | Auto-approve | Under 3 minutes |
| Amber Zone | 0.31 to 0.69 | Soft flag with background check; first-time Amber is always auto-approved | 2 to 4 hours |
| Red Zone | 0.70 to 1.00 | Hold for human review with a one-tap appeal option | 24 to 48 hours |

The word "fraud" is never shown to a worker. A first-time Amber flag is always auto-approved. A single flag carries no permanent penalty and resets after 90 clean days. The appeal is a single tap with an optional location photo and no complex forms.

---

## Dashboards

### Worker Dashboard

| Section | What It Shows |
|---|---|
| Coverage Status | Active or inactive badge, plan name, weekly coverage amount, renewal date |
| This Week's Earnings | Daily earnings bar chart pulled from platform data, week-to-date total |
| Disruption Alerts | Live zone map with active trigger type, severity, and estimated duration |
| Payout History | Date, trigger, amount, and processing time for every payout received |
| Claim Status Tracker | Live Green, Amber, or Red status of any in-progress claim |
| Loyalty Milestone | Progress bar tracking the path to a 6-month clean claim loyalty discount |

### Admin and Insurer Dashboard

| Section | What It Shows |
|---|---|
| Live Operations | Active policies, claims today, payouts today, workers currently in disruption zones |
| Loss Ratio Analytics | Loss ratio broken down by week, trigger type, city zone, and plan tier |
| Fraud Intelligence Queue | Red zone claims awaiting review, fraud score breakdown, ring detection alerts |
| Predictive Analytics | 7-day weather forecast combined with projected claim volume and payout liability |
| Trigger Calibration | Hit rate and false positive rate per trigger with threshold adjustment controls |

---

## Why a Progressive Web App

GigShield is built as a PWA rather than a native mobile app for four clear reasons.

There is no Play Store barrier. Raju gets a WhatsApp link, opens it in Chrome, and is connected and insured in under 2 minutes. No download, no storage used on his already-full budget phone.

Judges can evaluate it instantly. Any judge opens the URL in their browser with no APK and no 3 to 7 day Play Store approval delay that could risk the submission deadline.

All sensors are available. GPS via the Geolocation API, motion via the DeviceMotion API, and WiFi vs 4G via the Network Information API cover everything fraud detection needs and are all accessible through browser APIs.

The 6-week timeline is achievable. A proper Android app takes 8 to 10 weeks. The PWA delivers a complete, polished product within the hackathon window.

Phase 3 roadmap: a native Android app using React Native, where 70 percent of the PWA codebase is directly reusable.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js with TypeScript and Tailwind CSS | Worker dashboard, onboarding, admin panel |
| Backend | Node.js with Express.js | Policy management, claims processing, trigger monitoring |
| ML Services | Python with FastAPI, XGBoost, and scikit-learn | Premium calculator, fraud scorer, churn predictor |
| Database | PostgreSQL as primary, Redis for cache, Firebase for mobile sync and auth | Storage, real-time cache, mobile state |
| Real-Time Events | Socket.io and WebSockets | Live disruption alerts and instant payout notifications |
| Payments | Razorpay Test Mode | Premium collection and payout simulation |
| Maps and Zones | Google Maps Platform API | Pin-code zone polygon mapping and risk heat maps |
| Hosting | Railway, Render, or AWS EC2 | Scalable cloud deployment accessible via URL |
| CI/CD | GitHub Actions | Automated testing, linting, and deployment pipeline |

### External API Integrations

| API | Purpose | Triggers |
|---|---|---|
| OpenWeatherMap | Rainfall and heat index data | Triggers 1 and 2 |
| AQICN | Air Quality Index by zone | Trigger 3 |
| NewsAPI | Curfew and strike detection | Trigger 4 |
| Mock Platform API | Zepto and Blinkit delivery pause signal | Trigger 5 |
| Razorpay | Premium collection and payout | Payment layer |
| Google Maps | Pin-code zone polygon mapping | Zone risk scoring |

---

## Architecture Data Flow

```
External APIs
    └── Trigger Monitor Service (Node.js cron, every 5 minutes)
            └── Zone Alert Queue (Redis pub/sub)
                    └── Worker Policy Matcher (active policies in affected zone)
                            └── Claim Initiator Service
                                    └── Fraud Scoring Service (Python ML via FastAPI)
                                            └── Decision Router (Green, Amber, or Red)
                                                    └── Payout Service (Razorpay mock)
                                                    └── Notification Service (SMS and push)
                                                    └── PostgreSQL

Analytics Pipeline:
    PostgreSQL → Aggregation jobs (Node cron) → Dashboard API → React dashboards
```
---

## Business Viability

**Market Size**

India has over 15 million gig delivery workers. Approximately 1.2 million Q-commerce workers in urban areas with smartphones form the addressable market. Annual premium revenue at 1 percent penetration reaches Rs 3.68 Crore. At 5 percent penetration it reaches Rs 18.4 Crore.

**Unit Economics for Pro Shield at Rs 59 per week per worker**

| Item | Amount |
|---|---|
| Weekly premium collected | Rs 59.00 |
| Expected claim payout | -Rs 28.13 |
| Fraud loss provision at 3% budget | -Rs 1.77 |
| Operational cost covering tech and support | -Rs 8.00 |
| Net margin per worker per week | Rs 21.10, which is 35.8% |

**Catastrophe Risk Management**

A catastrophe reserve is built by saving 40 percent of weekly profit, reaching approximately Rs 3.7 lakh after 6 months. Workers are spread across 5 cities, so a city-level flood affects only 20 percent of the portfolio rather than the full book. A partner reinsurer covers claims exceeding a defined threshold, which is standard practice across the insurance industry. Monsoon surge pricing of plus 15 percent from June through September builds extra reserve precisely before the high-risk season.

---


## Coverage Scope

| Rule | Commitment |
|---|---|
| Coverage scope | Income loss only. No vehicle repair, no health insurance, no accident medical bills, ever. |
| Pricing model | Weekly premium structure aligned to the gig worker pay cycle. No monthly or annual options. |
| Persona focus | Q-Commerce delivery partners on Zepto, Blinkit, and Swiggy Instamart exclusively. |
| Trigger type | External environmental and social disruptions only. Personal choice not to work is excluded. |

---


