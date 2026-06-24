import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

data = pd.DataFrame({
    "day": [1,2,3,4,5,6,7],
    "bookings": [20,25,40,35,50,70,65]
})

X = data[["day"]]
y = data["bookings"]

model = RandomForestRegressor()
model.fit(X, y)

joblib.dump(model, "ml/demand_predictor.pkl")

print("Demand model saved")