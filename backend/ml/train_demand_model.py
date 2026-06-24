import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

data = pd.DataFrame({
    "day_of_week": [1, 2, 3, 4, 5, 6, 7],
    "bookings": [20, 25, 30, 35, 50, 80, 70]
})

X = data[["day_of_week"]]
y = data["bookings"]

model = RandomForestRegressor()
model.fit(X, y)

save_path = os.path.join(os.path.dirname(__file__), "demand_predictor.pkl")
joblib.dump(model, save_path)

print("Demand model saved successfully")