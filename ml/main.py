from datetime import datetime, timedelta, timezone
import asyncio
import json
from pathlib import Path
import random
from typing import Dict, List

from faker import Faker
import numpy as np
import pandas as pd
import pickle
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor, IsolationForest
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "backend" / "ml" / "data"
MODELS_DIR = PROJECT_ROOT / "backend" / "ml" / "models"
FRAUD_DATA_PATH = DATA_DIR / "fraud_data.csv"
PREMIUM_DATA_PATH = DATA_DIR / "premium_data.csv"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_model.pkl"
PREMIUM_MODEL_PATH = MODELS_DIR / "premium_model.pkl"

fake = Faker()
app = FastAPI(title="GigShield ML Services")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

fraud_model: HistGradientBoostingClassifier | None = None
premium_model: HistGradientBoostingRegressor | None = None
ring_model: IsolationForest | None = None
metrics_store: Dict[str, Dict[str, float]] = {
    "fraud_model": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0},
    "premium_model": {"r2_score": 0.0, "mae": 0.0},
}
auto_triggered_claims: List[Dict] = []
weather_state: Dict[str, str | float | bool] = {
    "source": "none",
    "is_rainstorm": False,
    "rain_mm": 0.0,
}


class FraudPredictInput(BaseModel):
    claim_amount: float = Field(..., ge=100)
    location_consistency: float = Field(..., ge=0.0, le=1.0)
    weather_correlation: float = Field(..., ge=0.0, le=1.0)
    claim_frequency: float = Field(..., ge=0.0)
    time_anomalies: float = Field(..., ge=0.0, le=1.0)


class PremiumPredictInput(BaseModel):
    age: int = Field(..., ge=18, le=70)
    years_experience: float = Field(..., ge=0.0, le=50.0)
    monthly_income: float = Field(..., ge=5000.0)
    avg_claims_per_year: float = Field(..., ge=0.0)
    city_risk_index: float = Field(..., ge=0.5, le=2.5)
    weather_exposure_index: float = Field(..., ge=0.0, le=1.0)
    safety_score: float = Field(..., ge=0.0, le=1.0)


class RingClaim(BaseModel):
    claim_id: str
    zone: str
    timestamp: datetime
    claim_amount: float


class RingDetectInput(BaseModel):
    claims: List[RingClaim]


class LegacyPremiumInput(BaseModel):
    plan_type: str
    zone_risk: float
    rating: float
    tenure_months: int
    season: str
    claim_history: int
    shift: str


class LegacyRiskInput(BaseModel):
    zone_risk: float
    tenure_months: int
    rating: float
    claim_history: int


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)


def generate_fraud_dataset(n_total: int = 1000) -> pd.DataFrame:
    n_genuine = 700
    n_fraud = n_total - n_genuine
    rows: List[Dict] = []
    for _ in range(n_genuine):
        rows.append(
            {
                "claim_amount": np.random.normal(18000, 4000),
                "location_consistency": np.random.uniform(0.7, 1.0),
                "weather_correlation": np.random.uniform(0.65, 1.0),
                "claim_frequency": np.random.uniform(0.1, 2.2),
                "time_anomalies": np.random.uniform(0.0, 0.35),
                "is_fraud": 0,
            }
        )
    for _ in range(n_fraud):
        rows.append(
            {
                "claim_amount": np.random.normal(62000, 18000),
                "location_consistency": np.random.uniform(0.0, 0.55),
                "weather_correlation": np.random.uniform(0.0, 0.5),
                "claim_frequency": np.random.uniform(2.0, 8.0),
                "time_anomalies": np.random.uniform(0.45, 1.0),
                "is_fraud": 1,
            }
        )
    df = pd.DataFrame(rows)
    df["claim_amount"] = np.clip(df["claim_amount"], 500, None)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    df.to_csv(FRAUD_DATA_PATH, index=False)
    return df


def generate_premium_dataset(n_samples: int = 500) -> pd.DataFrame:
    rows: List[Dict] = []
    for _ in range(n_samples):
        age = random.randint(18, 65)
        years_experience = round(max(0.0, age - random.randint(18, 28)) * random.uniform(0.6, 1.0), 1)
        monthly_income = round(random.uniform(10000, 90000), 2)
        avg_claims_per_year = round(random.uniform(0.0, 4.0), 2)
        city_risk_index = round(random.uniform(0.8, 2.0), 2)
        weather_exposure_index = round(random.uniform(0.1, 1.0), 2)
        safety_score = round(random.uniform(0.1, 1.0), 2)

        premium = (
            900
            + (city_risk_index * 700)
            + (weather_exposure_index * 550)
            + (avg_claims_per_year * 320)
            - (safety_score * 500)
            - (years_experience * 7)
            + np.random.normal(0, 120)
        )
        premium = max(500.0, float(round(premium, 2)))
        rows.append(
            {
                "worker_name": fake.name(),
                "age": age,
                "years_experience": years_experience,
                "monthly_income": monthly_income,
                "avg_claims_per_year": avg_claims_per_year,
                "city_risk_index": city_risk_index,
                "weather_exposure_index": weather_exposure_index,
                "safety_score": safety_score,
                "premium": premium,
            }
        )
    df = pd.DataFrame(rows)
    df.to_csv(PREMIUM_DATA_PATH, index=False)
    return df


def train_fraud_model(df: pd.DataFrame) -> HistGradientBoostingClassifier:
    X = df[["claim_amount", "location_consistency", "weather_correlation", "claim_frequency", "time_anomalies"]]
    y = df["is_fraud"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = HistGradientBoostingClassifier(random_state=42, max_depth=5)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    metrics_store["fraud_model"] = {
        "accuracy": float(round(accuracy_score(y_test, preds), 4)),
        "precision": float(round(precision_score(y_test, preds, zero_division=0), 4)),
        "recall": float(round(recall_score(y_test, preds, zero_division=0), 4)),
    }
    metrics_store["fraud_model"]["confusion_matrix"] = confusion_matrix(y_test, preds).tolist()

    with FRAUD_MODEL_PATH.open("wb") as f:
        pickle.dump(model, f)
    return model


def train_premium_model(df: pd.DataFrame) -> HistGradientBoostingRegressor:
    feature_cols = [
        "age",
        "years_experience",
        "monthly_income",
        "avg_claims_per_year",
        "city_risk_index",
        "weather_exposure_index",
        "safety_score",
    ]
    X = df[feature_cols]
    y = df["premium"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = HistGradientBoostingRegressor(random_state=42, max_depth=6)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    metrics_store["premium_model"] = {
        "r2_score": float(round(r2_score(y_test, preds), 4)),
        "mae": float(round(mean_absolute_error(y_test, preds), 4)),
    }

    with PREMIUM_MODEL_PATH.open("wb") as f:
        pickle.dump(model, f)
    return model


def train_ring_model() -> IsolationForest:
    baseline = []
    now = datetime.now(timezone.utc)
    for _ in range(1000):
        claim_count_5m = np.random.poisson(lam=7)
        max_gap_seconds = np.random.uniform(15, 280)
        amount_mean = np.random.normal(19000, 5000)
        baseline.append(
            [
                claim_count_5m,
                max_gap_seconds,
                amount_mean,
                (now - timedelta(minutes=np.random.randint(0, 120))).hour,
            ]
        )
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(np.array(baseline))
    return model


def bootstrap_models() -> None:
    global fraud_model, premium_model, ring_model
    ensure_dirs()
    fraud_df = generate_fraud_dataset()
    premium_df = generate_premium_dataset()
    fraud_model = train_fraud_model(fraud_df)
    premium_model = train_premium_model(premium_df)
    ring_model = train_ring_model()


def evaluate_weather_risk(payload: Dict) -> Dict[str, float | bool]:
    rain_mm = 0.0
    if payload.get("hourly", {}).get("precipitation"):
        values = payload["hourly"]["precipitation"][:3]
        rain_mm = float(max(values)) if values else 0.0
    is_rainstorm = rain_mm >= 12.0
    return {"is_rainstorm": is_rainstorm, "rain_mm": rain_mm}


def fetch_weather_signal() -> Dict[str, float | bool | str]:
    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&hourly=precipitation&forecast_days=1",
            timeout=8,
        )
        response.raise_for_status()
        signal = evaluate_weather_risk(response.json())
        return {"source": "open-meteo", **signal}
    except Exception:
        fallback_rain = float(round(np.random.uniform(0.0, 20.0), 2))
        return {"source": "synthetic-fallback", "is_rainstorm": fallback_rain >= 12.0, "rain_mm": fallback_rain}


def trigger_auto_claims(reason: str, max_claims: int = 20) -> List[Dict]:
    generated: List[Dict] = []
    for _ in range(max_claims):
        generated.append(
            {
                "claim_id": f"auto-{fake.uuid4()[:8]}",
                "worker_name": fake.name(),
                "zone": random.choice(["North", "South", "East", "West", "Central"]),
                "trigger_reason": reason,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    auto_triggered_claims.extend(generated)
    return generated


async def weather_cron_loop() -> None:
    while True:
        signal = fetch_weather_signal()
        weather_state.update(signal)
        if signal["is_rainstorm"]:
            trigger_auto_claims(f"weather_cron_rainstorm_{signal['rain_mm']}mm", max_claims=10)
        await asyncio.sleep(900)


@app.on_event("startup")
async def startup_event() -> None:
    bootstrap_models()
    asyncio.create_task(weather_cron_loop())


@app.post("/predict/fraud")
def predict_fraud(payload: FraudPredictInput):
    if fraud_model is None:
        bootstrap_models()
    X = pd.DataFrame(
        [
            {
                "claim_amount": payload.claim_amount,
                "location_consistency": payload.location_consistency,
                "weather_correlation": payload.weather_correlation,
                "claim_frequency": payload.claim_frequency,
                "time_anomalies": payload.time_anomalies,
            }
        ]
    )
    fraud_score = float(round(fraud_model.predict_proba(X)[0][1], 4))
    return {"fraud_score": fraud_score, "is_fraud": fraud_score >= 0.5}


@app.post("/predict/premium")
def predict_premium(payload: PremiumPredictInput):
    if premium_model is None:
        bootstrap_models()
    X = pd.DataFrame(
        [
            {
                "age": payload.age,
                "years_experience": payload.years_experience,
                "monthly_income": payload.monthly_income,
                "avg_claims_per_year": payload.avg_claims_per_year,
                "city_risk_index": payload.city_risk_index,
                "weather_exposure_index": payload.weather_exposure_index,
                "safety_score": payload.safety_score,
            }
        ]
    )
    premium = float(round(float(premium_model.predict(X)[0]), 2))
    return {"premium": premium}


@app.post("/ml/premium")
def legacy_premium(payload: LegacyPremiumInput):
    """
    Backward-compatible endpoint for existing frontend flow.
    """
    plan_base = {"Basic": 29, "Pro": 59, "Elite": 99}
    base = plan_base.get(payload.plan_type, 59)
    zone_multiplier = payload.zone_risk
    rating_multiplier = 0.90 if payload.rating >= 4.5 else (0.95 if payload.rating >= 4.0 else 1.0)
    tenure_multiplier = 0.85 if payload.tenure_months >= 12 else (0.92 if payload.tenure_months >= 6 else 1.0)
    season_multiplier = 1.15 if payload.season == "monsoon" else (0.90 if payload.season == "winter" else 1.0)
    loyalty_multiplier = 0.80 if payload.claim_history == 0 else (0.90 if payload.claim_history <= 1 else 1.0)
    shift_multiplier = 1.05 if payload.shift == "night" else 1.0

    adjusted = round(
        base
        * zone_multiplier
        * rating_multiplier
        * tenure_multiplier
        * season_multiplier
        * loyalty_multiplier
        * shift_multiplier
    )
    last_week_earnings = 6500
    max_weekly_payout = {"Basic": 1000, "Pro": 2000, "Elite": 3500}
    weekly_coverage = min(max_weekly_payout.get(payload.plan_type, 2000), last_week_earnings * 0.40)

    return {
        "base_premium": base,
        "adjusted_premium": adjusted,
        "breakdown": {
            "zone_risk": f"{zone_multiplier}x",
            "rating": f"{rating_multiplier}x",
            "tenure": f"{tenure_multiplier}x",
            "season": f"{season_multiplier}x",
            "loyalty": f"{loyalty_multiplier}x",
            "shift": f"{shift_multiplier}x",
        },
        "weekly_coverage": weekly_coverage,
        "last_week_earnings": last_week_earnings,
    }


@app.post("/ml/risk-score")
def legacy_risk_score(payload: LegacyRiskInput):
    """
    Backward-compatible endpoint for OAuth risk score flow.
    """
    score = 50
    score += (payload.zone_risk - 1.0) * 30
    score -= min(payload.tenure_months * 2, 20)
    score -= (payload.rating - 3.0) * 8
    score += payload.claim_history * 5
    score = max(10, min(95, round(score)))

    if score < 40:
        recommended = "Basic"
        reason = "Low risk profile - Basic Shield is sufficient"
    elif score < 70:
        recommended = "Pro"
        reason = "Moderate risk - Pro Shield recommended"
    else:
        recommended = "Elite"
        reason = "Higher risk zone or history - Elite Shield recommended"

    return {"risk_score": score, "recommended_plan": recommended, "reason": reason}


@app.post("/detect/ring")
def detect_ring(payload: RingDetectInput):
    if ring_model is None:
        bootstrap_models()
    if not payload.claims:
        return {"risk_score": 0.0, "cluster_members": []}

    now = datetime.now(timezone.utc)
    zone_groups: Dict[str, List[RingClaim]] = {}
    for claim in payload.claims:
        zone_groups.setdefault(claim.zone, []).append(claim)

    cluster_members: List[Dict] = []
    max_risk = 0.0
    for zone, claims in zone_groups.items():
        window_claims = [c for c in claims if abs((now - c.timestamp).total_seconds()) <= 300]
        claim_count_5m = len(window_claims)
        if claim_count_5m < 1:
            continue

        timestamps = sorted([c.timestamp for c in window_claims])
        if len(timestamps) > 1:
            gaps = [
                abs((timestamps[i] - timestamps[i - 1]).total_seconds())
                for i in range(1, len(timestamps))
            ]
            max_gap_seconds = max(gaps)
        else:
            max_gap_seconds = 300.0
        amount_mean = float(np.mean([c.claim_amount for c in window_claims]))
        hour = now.hour

        features = np.array([[claim_count_5m, max_gap_seconds, amount_mean, hour]])
        anomaly = int(ring_model.predict(features)[0] == -1)
        volume_trigger = claim_count_5m >= 30
        zone_risk = 0.75 if (volume_trigger or anomaly) else 0.2
        max_risk = max(max_risk, zone_risk)

        if volume_trigger or anomaly:
            cluster_members.extend(
                [
                    {
                        "claim_id": c.claim_id,
                        "zone": zone,
                        "timestamp": c.timestamp.isoformat(),
                        "claim_amount": c.claim_amount,
                    }
                    for c in window_claims
                ]
            )

    return {"risk_score": float(round(max_risk, 3)), "cluster_members": cluster_members}


@app.get("/model/metrics")
def get_model_metrics():
    return {
        "fraud_model": {
            "accuracy": metrics_store["fraud_model"]["accuracy"],
            "precision": metrics_store["fraud_model"]["precision"],
            "recall": metrics_store["fraud_model"]["recall"],
            "confusion_matrix": metrics_store["fraud_model"].get("confusion_matrix", [[0, 0], [0, 0]]),
        },
        "premium_model": {
            "r2_score": metrics_store["premium_model"]["r2_score"],
            "mae": metrics_store["premium_model"]["mae"],
        },
    }


@app.post("/simulate/rainstorm")
def simulate_rainstorm():
    return {
        "message": "Rainstorm simulation is orchestrated by backend endpoint POST /simulate/rainstorm",
        "deprecated": True,
    }


@app.get("/auto-claims")
def get_auto_claims():
    return {
        "count": len(auto_triggered_claims),
        "latest_weather": weather_state,
        "claims": auto_triggered_claims[-100:],
    }


@app.post("/models/retrain")
def retrain_models():
    bootstrap_models()
    metrics_path = MODELS_DIR / "metrics_snapshot.json"
    metrics_path.write_text(json.dumps(get_model_metrics(), indent=2), encoding="utf-8")
    return {"status": "retrained", "metrics": get_model_metrics()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
