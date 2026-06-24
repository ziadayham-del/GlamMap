import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os

data = pd.DataFrame({
    "weekend": [0, 0, 0, 1, 1],
    "multiplier": [1.0, 1.0, 1.1, 1.3, 1.5]
})

X = data[["weekend"]]
y = data["multiplier"]

model = LinearRegression()
model.fit(X, y)

save_path = os.path.join(os.path.dirname(__file__), "price_model.pkl")
joblib.dump(model, save_path)

print("Price model saved successfully")
