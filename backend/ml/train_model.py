"""
train_model.py
Generates 2000 synthetic pricing records and trains a Random Forest regressor.
Saves the model as model.pkl.

Run: python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

np.random.seed(42)
N = 2000

# Category base rates (same as pricingEngine.js)
BASE_RATES = {0: 250, 1: 400, 2: 200, 3: 220, 4: 150, 5: 300, 6: 350}

# Subcategory multipliers per category
SUBCATEGORY_MULTIPLIERS = {
    0: {0: 1.0, 1: 0.8, 2: 1.3, 3: 1.2, 4: 1.1},          # Design
    1: {0: 1.4, 1: 1.2, 2: 1.3, 3: 1.1, 4: 1.5},          # Coding
    2: {0: 1.0, 1: 1.1, 2: 1.3, 3: 1.2},                   # Writing
    3: {0: 1.4, 1: 1.0, 2: 1.2},                            # Editing
    4: {0: 1.0, 1: 1.2, 2: 1.1},                            # Delivery
    5: {0: 1.2, 1: 1.4, 2: 1.3},                            # Marketing
    6: {0: 1.0, 1: 1.3, 2: 1.2, 3: 1.4},                   # Tutoring
}
SUBCATEGORY_COUNTS = {k: len(v) for k, v in SUBCATEGORY_MULTIPLIERS.items()}
TIER_MULTIPLIERS = {1: 1.0, 2: 1.15, 3: 1.3}

# Generate synthetic dataset
records = []
for _ in range(N):
    cat_id = np.random.randint(0, 7)
    sub_id = np.random.randint(0, SUBCATEGORY_COUNTS[cat_id])
    hours = round(np.random.uniform(1, 6), 1)
    tier = np.random.choice([1, 2, 3])
    demand_score = round(np.random.choice([0.9, 1.0, 1.1]), 2)
    inflation_factor = round(np.random.uniform(0.95, 1.10), 2)

    base = BASE_RATES[cat_id]
    sub_mult = SUBCATEGORY_MULTIPLIERS[cat_id][sub_id]
    tier_mult = TIER_MULTIPLIERS[tier]

    det_price = base * sub_mult * tier_mult * demand_score * inflation_factor * hours

    # Add ±10% noise for the target
    noise = np.random.uniform(-0.10, 0.10)
    final_price = round(det_price * (1 + noise), 2)

    records.append({
        'category_id': cat_id,
        'subcategory_id': sub_id,
        'hours': hours,
        'tier': tier,
        'demand_score': demand_score,
        'inflation_factor': inflation_factor,
        'deterministic_price': round(det_price, 2),
        'final_price': final_price,
    })

df = pd.DataFrame(records)
print(f"Dataset shape: {df.shape}")
print(df.head())

FEATURES = ['category_id', 'subcategory_id', 'hours', 'tier', 'demand_score', 'inflation_factor', 'deterministic_price']
TARGET = 'final_price'

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"\nModel MAE on test set: ₹{mae:.2f}")

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
joblib.dump(model, model_path)
print(f"Model saved to: {model_path}")
