"""
app.py — FastAPI ML Microservice
Loads the trained Random Forest model and exposes POST /predict.

Run: uvicorn app:app --host 0.0.0.0 --port 8000
"""

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="CampusConnect ML Pricing Service", version="1.0")

# Load model at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ ML model loaded from {MODEL_PATH}")
except FileNotFoundError:
    model = None
    print("⚠️  model.pkl not found. Run train_model.py first.")


class PredictRequest(BaseModel):
    category_id: int
    subcategory_id: int
    hours: float
    tier: int
    demand_score: float
    inflation_factor: float
    deterministic_price: float


class PredictResponse(BaseModel):
    ml_price: float


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train_model.py first.")

    features = np.array([[
        req.category_id,
        req.subcategory_id,
        req.hours,
        req.tier,
        req.demand_score,
        req.inflation_factor,
        req.deterministic_price,
    ]])

    prediction = model.predict(features)[0]
    return PredictResponse(ml_price=round(float(prediction), 2))
