from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pickle
import os

app = FastAPI(title="GigShield ML Services")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── PREMIUM CALCULATOR ───────────────────────────────────────────────────────
class PremiumInput(BaseModel):
    plan_type: str        # Basic, Pro, Elite
    zone_risk: float      # 0.8 to 1.4
    rating: float         # 1.0 to 5.0
    tenure_months: int    # months active
    season: str           # monsoon, winter, summer
    claim_history: int    # claims in last 6 months
    shift: str            # morning, evening, night

class PremiumOutput(BaseModel):
    base_premium: float
    adjusted_premium: float
    breakdown: dict
    weekly_coverage: float
    last_week_earnings: float

@app.post("/ml/premium", response_model=PremiumOutput)
def calculate_premium(data: PremiumInput):
    base_rates = {"Basic": 29, "Pro": 59, "Elite": 99}
    base = base_rates.get(data.plan_type, 59)

    # multipliers from README
    zone_multiplier    = data.zone_risk
    rating_multiplier  = 0.90 if data.rating >= 4.5 else (0.95 if data.rating >= 4.0 else 1.0)
    tenure_multiplier  = 0.85 if data.tenure_months >= 12 else (0.92 if data.tenure_months >= 6 else 1.0)
    season_multiplier  = 1.15 if data.season == "monsoon" else (0.90 if data.season == "winter" else 1.0)
    loyalty_multiplier = 0.80 if data.claim_history == 0 else (0.90 if data.claim_history <= 1 else 1.0)
    shift_multiplier   = 1.05 if data.shift == "night" else 1.0

    adjusted = round(base * zone_multiplier * rating_multiplier * tenure_multiplier * season_multiplier * loyalty_multiplier * shift_multiplier)

    # earnings-linked coverage from README: 40% of last week earnings
    last_week_earnings = 6500  # would come from platform API in production
    max_weekly_payout  = {"Basic": 1000, "Pro": 2000, "Elite": 3500}
    weekly_coverage    = min(max_weekly_payout[data.plan_type], last_week_earnings * 0.40)

    return PremiumOutput(
        base_premium=base,
        adjusted_premium=adjusted,
        breakdown={
            "base": base,
            "zone_risk":    f"{zone_multiplier}x",
            "rating":       f"{rating_multiplier}x",
            "tenure":       f"{tenure_multiplier}x",
            "season":       f"{season_multiplier}x",
            "loyalty":      f"{loyalty_multiplier}x",
            "shift":        f"{shift_multiplier}x"
        },
        weekly_coverage=weekly_coverage,
        last_week_earnings=last_week_earnings
    )


# ─── FRAUD DETECTION ENGINE ───────────────────────────────────────────────────
class FraudInput(BaseModel):
    gps_stability: float        # 0-1, 1=stable (suspicious if too stable)
    accelerometer_variance: float  # 0-1, low=sitting still
    network_type: str           # wifi or 4g
    mins_since_last_order: int  # minutes since last delivery order
    filing_speed_seconds: int   # how fast claim was filed after trigger
    cohort_spike: bool          # 30+ claims same zone same time
    device_accounts: int        # how many accounts on this device
    worker_id: str

class SignalResult(BaseModel):
    signal: str
    value: str
    suspicious: bool
    weight: float
    contribution: float

class FraudOutput(BaseModel):
    score: float
    tier: str
    tier_color: str
    auto_action: str
    signals: List[SignalResult]
    worker_message: str

@app.post("/ml/fraud-score", response_model=FraudOutput)
def calculate_fraud_score(data: FraudInput):
    signals = []
    total_score = 0.0

    # Signal 1: GPS Stability (from README — spoofing apps give unnaturally stable GPS)
    gps_suspicious = data.gps_stability > 0.95
    gps_contribution = 0.20 if gps_suspicious else 0.0
    signals.append(SignalResult(
        signal="GPS Stability",
        value=f"{data.gps_stability:.2f} (perfect=suspicious)",
        suspicious=gps_suspicious,
        weight=0.20,
        contribution=gps_contribution
    ))
    total_score += gps_contribution

    # Signal 2: Accelerometer (from README — no motion = sitting at home)
    acc_suspicious = data.accelerometer_variance < 0.1
    acc_contribution = 0.20 if acc_suspicious else 0.0
    signals.append(SignalResult(
        signal="Accelerometer / Motion",
        value=f"variance={data.accelerometer_variance:.2f} ({'static' if acc_suspicious else 'moving'})",
        suspicious=acc_suspicious,
        weight=0.20,
        contribution=acc_contribution
    ))
    total_score += acc_contribution

    # Signal 3: Network Type (from README — home WiFi = dead giveaway)
    net_suspicious = data.network_type.lower() == "wifi"
    net_contribution = 0.20 if net_suspicious else 0.0
    signals.append(SignalResult(
        signal="Network Type",
        value=f"{data.network_type.upper()} ({'home WiFi — red flag' if net_suspicious else 'field 4G — normal'})",
        suspicious=net_suspicious,
        weight=0.20,
        contribution=net_contribution
    ))
    total_score += net_contribution

    # Signal 4: Order History (from README — real worker was working before disruption)
    order_suspicious = data.mins_since_last_order > 90
    order_contribution = 0.15 if order_suspicious else 0.0
    signals.append(SignalResult(
        signal="Platform Order History",
        value=f"{data.mins_since_last_order} min since last order ({'no recent orders' if order_suspicious else 'active worker'})",
        suspicious=order_suspicious,
        weight=0.15,
        contribution=order_contribution
    ))
    total_score += order_contribution

    # Signal 5: Filing Speed (from README — bots file instantly)
    speed_suspicious = data.filing_speed_seconds < 3
    speed_contribution = 0.10 if speed_suspicious else 0.0
    signals.append(SignalResult(
        signal="Claim Filing Speed",
        value=f"{data.filing_speed_seconds}s after trigger ({'instant = bot' if speed_suspicious else 'human delay — normal'})",
        suspicious=speed_suspicious,
        weight=0.10,
        contribution=speed_contribution
    ))
    total_score += speed_contribution

    # Signal 6: Cohort Spike (from README — 30+ claims in 5 mins = ring)
    cohort_contribution = 0.10 if data.cohort_spike else 0.0
    signals.append(SignalResult(
        signal="Cohort Spike Detection",
        value=f"{'30+ claims from same zone — ring detected!' if data.cohort_spike else 'Normal claim volume'}",
        suspicious=data.cohort_spike,
        weight=0.10,
        contribution=cohort_contribution
    ))
    total_score += cohort_contribution

    # Signal 7: Device Fingerprint (from README — multiple accounts per IMEI)
    device_suspicious = data.device_accounts > 1
    device_contribution = 0.05 if device_suspicious else 0.0
    signals.append(SignalResult(
        signal="Device Fingerprint",
        value=f"{data.device_accounts} account(s) on this device ({'multiple = farm' if device_suspicious else 'single = normal'})",
        suspicious=device_suspicious,
        weight=0.05,
        contribution=device_contribution
    ))
    total_score += device_contribution

    # Determine tier from README thresholds
    score = round(min(total_score, 1.0), 2)
    if score <= 0.30:
        tier = "green"
        tier_color = "#22C55E"
        auto_action = "AUTO-APPROVE — Payout initiated instantly"
        worker_message = f"Disruption detected in your zone. ₹X credited to your UPI."
    elif score <= 0.69:
        tier = "amber"
        tier_color = "#F59E0B"
        auto_action = "SOFT FLAG — Background check running (2-4 hrs). First-time amber = auto-approved."
        worker_message = "We are verifying disruption data for your area — payout releasing shortly."
    else:
        tier = "red"
        tier_color = "#EF4444"
        auto_action = "HOLD FOR REVIEW — Human review queue (24-48 hrs). One-tap appeal available."
        worker_message = "Your claim requires additional verification. Our team will review shortly."

    return FraudOutput(
        score=score,
        tier=tier,
        tier_color=tier_color,
        auto_action=auto_action,
        signals=signals,
        worker_message=worker_message
    )


# ─── RISK SCORE FOR ONBOARDING ────────────────────────────────────────────────
class RiskInput(BaseModel):
    zone_risk: float
    tenure_months: int
    rating: float
    claim_history: int

@app.post("/ml/risk-score")
def calculate_risk_score(data: RiskInput):
    score = 50
    score += (data.zone_risk - 1.0) * 30
    score -= min(data.tenure_months * 2, 20)
    score -= (data.rating - 3.0) * 8
    score += data.claim_history * 5
    score = max(10, min(95, round(score)))

    if score < 40:
        recommended = "Basic"
        reason = "Low risk profile — Basic Shield is sufficient"
    elif score < 70:
        recommended = "Pro"
        reason = "Moderate risk — Pro Shield recommended"
    else:
        recommended = "Elite"
        reason = "Higher risk zone or history — Elite Shield recommended"

    return {"risk_score": score, "recommended_plan": recommended, "reason": reason}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
