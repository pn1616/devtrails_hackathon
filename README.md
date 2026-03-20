#  GigShield
### AI-Powered Parametric Income Protection for Gig Workers

- **Persona:** Q-Commerce Delivery Partners (Zepto, Blinkit, Swiggy Instamart)
- **Platform:** Progressive Web App (PWA) — React.js + Node.js
- **Coverage:** Income Loss ONLY (no health, vehicle repair, or accident cover)
- **Pricing:** Weekly subscription model — aligned to gig worker pay cycle

---

## About

GigShield is an AI-powered parametric insurance platform that protects gig workers from income loss due to external disruptions — weather, pollution, platform outages, and curfews.

It integrates directly with delivery platform databases (Zepto, Blinkit, Swiggy Instamart) via OAuth, pulling verified earnings, zone, rating, and order history automatically. Workers onboard in **3 taps**. Coverage runs **forever automatically**. Payouts happen in **under 3 minutes** with zero worker action required.

---

## Problem

**Meet Raju** — Q-commerce delivery partner for Zepto, Pune.
- Earns ₹700–₹900/day completing 25–35 deliveries
- On July 14, 2024 — extreme rain hit Pune (94mm in 3 hrs)
- Zepto suspended deliveries for 8 hours
- Raju lost ₹560 in a single day — with zero compensation
- Over monsoon season he loses ₹4,200–₹6,800 in income
- No savings buffer — takes loans at 3–5% monthly interest

**India has 15M+ gig delivery workers. None of them have income protection.**

Gig workers lose **20–30% of monthly income** due to:
- Heavy rain / floods
- Extreme heat
- Severe air pollution (AQI emergencies)
- Curfews / strikes
- Platform outages

They bear **100% of the financial loss** with no safety net.

---

## Solution — GigShield

GigShield automatically:
- Connects to the worker's existing platform account — no new registration
- Detects disruptions using real-time API data
- Cross-verifies events via 3-layer validation
- Scores every claim using a 7-dimension ML fraud model
- Triggers **instant UPI payouts in under 3 minutes**
- No forms. No phone calls. No waiting. No re-enrollment. Ever.

---

## Platform Integration — The Core Innovation

Zepto, Blinkit, and Swiggy Instamart already have a complete worker database — employee ID, verified earnings history, active zone, shift hours, platform rating, and UPI details. GigShield integrates directly with this database via OAuth API.

**The worker already exists in the system. We just connect to it.**

### The 3-Tap Onboarding Flow

| Step | What Happens |
|------|-------------|
| Tap 1 | Worker opens GigShield → taps **"Connect your Zepto account"** |
| Tap 2 | OAuth handshake with Zepto — same as "Login with Google." Profile auto-populated: name, zone, earnings last 4 weeks, rating, UPI ID |
| Tap 3 | Worker sees AI-recommended plan → picks Basic / Pro / Elite → confirms UPI autopay mandate via Razorpay |
| Done | **Coverage starts immediately. Forever.** |

That is the entire onboarding. No forms. No manual entry. Under 2 minutes.

### What Platform Data Gives Us

| Data Point | How GigShield Uses It |
|-----------|----------------------|
| Verified weekly earnings | Dynamic coverage formula — genuinely real-time, not estimated |
| Actual order history | Fraud detection behavioral signals — live data, not inferred |
| Real zone + pin-code | Hyperlocal risk scoring based on where worker actually delivers |
| Platform rating (live) | Premium discount adjusts automatically as rating changes |
| Shift hours | Risk model knows if worker operates day or night shift |
| UPI ID on file | Autopay mandate set once — no re-entry ever |

### The Sunday Autopay Loop — Zero Worker Involvement

Every Sunday night a batch job runs automatically:

1. Pulls last week's **verified earnings** from platform API
2. Recalculates **dynamic coverage** (40% of verified earnings, capped at plan maximum)
3. Recalculates **adjusted premium** (zone + rating + season multipliers)
4. Charges worker's UPI via **Razorpay standing mandate**
5. Updates policy for the coming week
6. Sends **one SMS**: "You're covered this week. ₹X coverage active."

The worker wakes up Monday morning already covered. They did nothing.

**UPI mandate failure handling:** If payment fails, coverage **pauses** (not cancels) for 48 hours with one automatic retry. Worker gets one notification. If it clears, coverage resumes seamlessly — no re-enrollment required.

### Hackathon Implementation — Mock Platform API

Zepto, Blinkit, and Swiggy do not have public APIs. For the hackathon we build a **realistic mock Zepto API** that returns worker data in the exact format a real integration would — employee ID, earnings history, zone polygon, rating, shift pattern. The architecture is identical to production. Judges understand this completely — it does not weaken the case at all.

---

## Key Features

- Platform-native onboarding — 3 taps, under 2 minutes
- Hyperlocal pin-code level risk assessment
- Earnings-linked dynamic coverage — scales with real verified earnings
- Zero-touch claims — fully automatic, no worker action needed
- Weekly pricing model — aligned to gig worker pay cycle
- AI-based fraud detection — 7-dimension behavioral scoring
- Platform outage coverage — unique Trigger 5
- Coordinated fraud ring detection — syndicate-proof architecture
- Face liveness detection at onboarding — KYC via one-time selfie

---

## Parametric Triggers

| # | Trigger | Condition | Data Source | Payout |
|---|---------|-----------|-------------|--------|
| 1 | Rainfall | >50mm/hr in worker's zone | OpenWeatherMap + IMD | 100% |
| 2 | Extreme Heat | >42°C heat index | OpenWeatherMap | 70% |
| 3 | Air Quality | AQI >300 (Severe+) | AQICN Free API | 60% |
| 4 | Curfew / Strike | Zone disruption detected | NewsAPI + civic data | 100% |
| 5 | Platform Outage | >45 min app downtime | Mock platform API | 80% |

> Highest applicable payout only — no stacking.
> All triggers are zone-specific at pin-code level — not city-wide averages.

### 3-Layer Trigger Verification
1. **Primary API** confirms threshold breached in worker's pin-code zone
2. **Secondary source** cross-validates (IMD backup, AQICN alternate)
3. **Platform echo** — if Zepto/Blinkit itself pauses deliveries in that zone → strong confirmation signal

---

## Weekly Pricing Model

| Plan | Weekly Premium | Daily Coverage | Max Weekly Payout | Eligibility |
|------|---------------|----------------|-------------------|-------------|
| Basic Shield | ₹29/week | ₹250/day | ₹1,000 | New workers (0–6 months) |
| Pro Shield | ₹59/week | ₹450/day | ₹2,000 | Active workers (6m+, 3.5★+) |
| Elite Shield | ₹99/week | ₹750/day | ₹3,500 | Top workers (1yr+, 4.5★+) |

### Earnings-Linked Dynamic Coverage

Coverage scales with what the worker **actually earned last week** — pulled directly from the platform database:

```
Weekly Coverage = Min(Plan Maximum, 40% × Last Week's Verified Earnings)
```

**Example:** Raju earned ₹6,500 last week (verified from Zepto) → Coverage = 40% × ₹6,500 = ₹2,600 (Pro Shield caps at ₹2,000)

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
- **Type:** Logistic Regression / Random Forest
- **Purpose:** Identify workers likely to cancel — trigger proactive re-engagement before lapse
- **Phase 1 status:** Designed; implemented in Phase 2

---

## Adversarial Defense & Anti-Spoofing Strategy

### The Threat
A coordinated syndicate of 500+ workers used GPS-spoofing apps and Telegram groups to trigger mass false payouts on a competitor platform. Simple GPS verification is obsolete. GigShield is built to be syndicate-proof from day one.

---

### Requirement 1 — Genuine Worker vs GPS Spoofer

**Core insight:** A real stranded worker was **actively working — accepting and completing orders — before the disruption hit**. A fraudster was never working. We verify work history directly from platform data — not just GPS position.

| Signal | Genuine Stranded Worker | GPS Spoofer |
|--------|------------------------|-------------|
| Platform order history | Active orders 30–90 min before disruption (verified from Zepto API) | No order activity for hours |
| Accelerometer | Bike vibration pattern before halt | Flat — sitting at home |
| Network type | 4G field signal, possible drops in rain | Stable home WiFi — dead giveaway |
| Claim filing speed | Human delay — wet hands, sheltering | Instant — automated script |
| App interaction | Checking map, order queue, navigation | Minimal — passive home screen |

---

### Requirement 2 — Coordinated Ring Detection (Beyond GPS)

4 ring-specific signals analyzed beyond individual GPS:

1. **Claim burst analysis** — 30+ claims in 5 minutes from same zone = coordinated attack. Genuine workers file sporadically at different times; organized rings file in synchronized bursts.
2. **Social graph fingerprinting** — same registration date + referral code + operating zone + simultaneous claims = ring signature score that compounds with each matching dimension
3. **Device fingerprint deduplication** — multiple GigShield accounts on same IMEI = immediate block across all accounts
4. **Behavioral cohort spike** — synchronized app opens 5–10 minutes before claim wave = Telegram coordination signal, detected without reading any messages

---

### Requirement 3 — UX Balance for Honest Workers

**The Golden Rule:** Better to pay one fraudster than deny 10 honest workers. Fraud loss is priced into premiums at a 3% budget — below that, every claim gets benefit of the doubt.

| Score | Tier | Worker Message | Timeline |
|-------|------|---------------|----------|
| 0.00–0.30 | 🟢 Green — Auto approve | Silent payout. SMS: "Disruption detected. ₹X credited to your UPI." | < 3 minutes |
| 0.31–0.69 | 🟡 Amber — Soft flag | "We are verifying disruption data for your area — payout releasing shortly." | 2–4 hours |
| 0.70–1.00 | 🔴 Red — Human review | "Your claim needs additional verification." + one-tap appeal option | 24–48 hours |

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
| Database | PostgreSQL + Redis | Policy/claims storage + real-time trigger cache |
| Real-Time | Socket.io / WebSockets | Live disruption alerts, instant payout notifications |
| Payments | Razorpay Test Mode | Autopay mandate + premium collection + payout simulation |
| Platform API | Mock Zepto/Blinkit OAuth API | Worker profile, earnings, zone, rating (simulated for hackathon) |
| External APIs | OpenWeatherMap, AQICN, NewsAPI, Google Maps | Triggers + zone risk mapping |
| Face Detection | face-api.js (browser-based) | Liveness KYC at onboarding — no data stored |
| Hosting | Railway / Render | Cloud deployment — accessible via URL instantly |
| CI/CD | GitHub Actions | Automated testing and deployment pipeline |

---

## 6-Week Development Plan

| Phase | Weeks | Theme | Key Deliverables |
|-------|-------|-------|-----------------|
| Phase 1 | Mar 4–20 | Ideation & Foundation | This README. UI wireframes. Mock OAuth onboarding. Premium calculator. Trigger simulator. Dashboard mockup. Face liveness demo. |
| Phase 2 | Mar 21–Apr 4 | Automation & Protection | Full OAuth + mock platform API. Policy management. ML premium v1. All 5 triggers live. Fraud detection engine. Autopay loop. 2-min demo video. |
| Phase 3 | Apr 5–17 | Scale & Optimise | Ring detection ML. Instant payout simulation. Full dashboards. Predictive analytics. 5-min demo video. Final pitch deck. |

### Phase 1 Prototype — What's Demonstrable Right Now
1. "Connect with Zepto" OAuth button → mock profile auto-population
2. AI-recommended plan based on pulled profile data
3. Interactive premium calculator (zone + rating + tenure → dynamic premium)
4. Disruption trigger simulator (select trigger → see automated payout flow with timing)
5. Worker dashboard mockup — all 6 metric sections
6. Admin dashboard mockup — fraud queue + KPI cards + predictive panel
7. Fraud score demo — mock Green / Amber / Red classification with signal breakdown
8. Face liveness detection — blink verification at onboarding (face-api.js)

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

## Closing Statement

Gig workers don't need charity. They need **predictable income protection**.

GigShield delivers that — automatically, instantly, and fairly.

The platform integration is the key insight: Raju already exists in Zepto's database. GigShield doesn't ask him to start over — it connects to what's already there, wraps it in a safety net, and makes sure he wakes up every Monday already covered.

> *"It is better to pay one fraudster than to wrongly deny 10 honest workers."*
> This philosophy is built into every layer of GigShield's architecture.

---

## Links


- **2-Minute Video:** [Add link here]
- **Team:** TrailCrafters
