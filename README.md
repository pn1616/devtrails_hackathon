# devtrails_hackathon

#  GigShield  
### AI-Powered Parametric Income Protection for Gig Workers  

- **Persona:** Q-Commerce Delivery Partners (Zepto, Blinkit, Instamart)  
- **Platform:** Web and Mobile application

---

## About
GigShield is an AI-powered parametric insurance platform that protects gig workers from income loss due to external disruptions (weather, pollution, outages).  
It uses **weekly pricing**, **real-time triggers**, and **zero-touch payouts**, with a **fraud-resistant architecture** built using behavioral signals beyond GPS.

---

##  Problem

Gig workers lose **20–30% of income** due to:
- Heavy rain / floods  
- Extreme heat    
- Curfews / strikes  
- Platform outages  

They have **no income protection**.

---

##  Solution — GigShield

GigShield automatically:
- Detects disruptions using real-time data  
- Verifies events via multiple sources  
- Triggers **instant payouts**  
 
---

##  Persona

**Raju — Q-commerce delivery partner (Zepto, Pune)**  
- Earns ₹700–₹900/day  
- Lost ₹560 in one day due to rain  
- No safety net  

 GigShield ensures he gets paid when he can’t work.

---

##  Key Features

- Hyperlocal Risk Assessment
- Earnings-linked coverage
- Zero-touch claims
- Weekly pricing model
- AI-based fraud detection
- Platform outage coverage

---

##  Parametric Triggers

| Trigger | Condition | Payout |
|--------|----------|--------|
| Rainfall | >50mm/hr | 100% |
| Heat | >42°C | 70% |
| Curfew/Strike | Zone disruption | 100% |
| Platform Outage | >45 min downtime | 80% |

 Highest applicable payout only (no stacking)

---

##  Weekly Pricing Model 

| Plan | Premium | Coverage |
|------|--------|----------|
| Basic | ₹29/week | ₹250/day |
| Pro | ₹59/week | ₹450/day |
| Elite | ₹99/week | ₹750/day |


### AI-Based Pricing Factors
- Zone risk  
- Worker rating  
- Tenure  
- Season  
- Claim history  

---

## Workflow

1. User registers  
2. Selects weekly plan  
3. System monitors conditions  
4. Trigger detected  
5. Fraud score calculated  
6. Payout sent instantly  


---

## 🔹 AI/ML Integration

### 1. Premium Model
- Predicts personalized weekly premium  

### 2. Fraud Detection Model
- Uses:
  - GPS + motion data  
  - Network signals  
  - Activity logs  
  - Claim patterns  

### 3. Churn Prediction
- Identifies users likely to drop off  

---

## Adversarial Defense & Anti-Spoofing

###  Fraud Scenarios
- GPS spoofing  
- Fake inactivity claims  
- Bot-based claim bursts  
- Coordinated fraud rings  

---

###  Detection Strategy

#### 1. Behavioral Verification
- Was user actively working before disruption?

#### 2. Sensor Fusion
- GPS + accelerometer + motion patterns  

#### 3. Network Validation
- WiFi vs 4G mismatch detection  

#### 4. Claim Timing Analysis
- Instant claims → bot flag  

---

###  Ring Detection

- Claim burst detection (30+ in 5 mins)  
- Same device / multiple accounts  
- Similar registration patterns  
- Synchronized activity spikes  

---

##  Fraud Scoring System

| Score | Action |
|------|--------|
| 0–0.3 | Auto approve |
| 0.31–0.69 | Soft verify |
| 0.7–1.0 | Manual review |

---

## UX Philosophy

- No “fraud” wording shown  
- First suspicious claim still approved  
- Simple appeal flow  

---

##  Dashboards

###  Worker Dashboard (Mobile based)
- Coverage status  
- Earnings protected  
- Disruption alerts  
- Payout history  

###  Admin Dashboard (Web based)
- Fraud detection queue  
- Claim analytics  
- Loss ratio  
- Predictive risk insights  

---

## Tech Stack

- **Frontend:** React + Tailwind (Web), Flutter (Mobile)  
- **Backend:** Node.js + Express (shared APIs for Web & Mobile)  
- **ML:** Python + FastAPI + XGBoost  
- **Database:** PostgreSQL + Redis (primary), Firebase (mobile sync & auth)  
- **APIs:** Weather, AQI, News (mock allowed)  
- **Payments:** Razorpay (test mode)    

---

##  Business Viability

- Target market: ~1.2M workers  
- Avg premium: ₹59/week  
- Margin: ~35%  

 Scalable + sustainable  

---

##  Why GigShield Wins

- Fully meets all requirements  
- Goes beyond basics (fraud + dashboards)  
- Strong business model  
- Real-world impact  

---

##  Closing Statement

Gig workers don’t need charity. They need predictable income protection.

GigShield delivers that  automatically, instantly, and fairly.

---