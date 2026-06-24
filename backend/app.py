import os
import sys
import base64
import traceback
from io import BytesIO
import joblib

BASE_DIR = os.path.dirname(__file__)

demand_model = joblib.load(
    os.path.join(BASE_DIR, "ml", "demand_predictor.pkl")
)

price_model = joblib.load(
    os.path.join(BASE_DIR, "ml", "price_model.pkl")
)

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from database import db
from models import Provider, Service, Slot, Booking  # --- UPDATED: Imports ---

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ai"))

from face_detector  import detect_face_bytes
from hand_detector  import detect_hand_bytes
from recommender    import recommend_style, recommend_nail_style
from ar_renderer    import render_overlay_bytes

FRONTEND_DIR = os.path.realpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend")
)

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///glammap.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ASSETS_ROOT = os.path.join(FRONTEND_DIR, "assets")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

VALID_FEATURES = {"hair", "beard", "moustache", "nails"}


# ── Helpers ────────────────────────────────────────────────────────────────

def _read_image_from_request() -> bytes | None:
    if "image" not in request.files:
        return None
    f = request.files["image"]
    if not f or f.filename == "":
        return None
    data = f.read(MAX_UPLOAD_BYTES)
    return data if data else None


def _read_base64_from_request() -> bytes | None:
    payload = request.get_json(silent=True) or {}
    b64 = payload.get("image_b64", "")
    if not b64:
        return None
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    try:
        return base64.b64decode(b64)
    except Exception:
        return None


def _form_or_json(key, default=None):
    json_payload = request.get_json(silent=True) or {}
    return request.form.get(key) or json_payload.get(key, default)


def _resolve_overlay_path(overlay_key: str) -> str | None:
    """
    "beard/Corporate_Beard" -> frontend/assets/beard_overlays/Corporate_Beard.png
    """
    parts = (overlay_key or "").split("/", 1)
    if len(parts) != 2:
        return None
    category, name = parts
    candidate = os.path.realpath(
        os.path.join(ASSETS_ROOT, f"{category}_overlays", f"{name}.png")
    )
    if not candidate.startswith(ASSETS_ROOT):
        return None
    if not os.path.isfile(candidate):
        return None
    return candidate


def _parse_bbox_form() -> dict | None:
    try:
        x = float(request.form.get("bbox_x", ""))
        y = float(request.form.get("bbox_y", ""))
        w = float(request.form.get("bbox_w", ""))
        h = float(request.form.get("bbox_h", ""))
    except (ValueError, TypeError):
        return None
    if w <= 0 or h <= 0:
        return None
    return {"x": x, "y": y, "w": w, "h": h}


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics/provider/<int:id>")
def analytics(id):
    provider = Provider.query.get(id)

    bookings = Booking.query.filter_by(provider_id=id).count()

    revenue = db.session.query(
        db.func.sum(Booking.price_paid)
    ).filter_by(provider_id=id).scalar()

    if revenue is None:
        revenue = 0

    return jsonify({
        "total_bookings": bookings,
        "revenue": revenue
    })

@app.get("/api/ai/predict-demand")
def predict_ai_demand():  # Changed from predict_demand to prevent collision
    try:
        day = int(request.args.get("day", 1))

        # Ensure your model expects exactly one argument or update the shape as needed
        predicted = demand_model.predict([[day]])[0]

        return jsonify({
            "success": True,
            "predicted_bookings": round(float(predicted), 2)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })
@app.post("/api/pricing/calculate")
def pricing_api():
    data = request.get_json()
    base_price = float(data["base_price"])

    from datetime import datetime

    now = datetime.now()
    multiplier = 1

    if now.weekday() >= 5:
        multiplier += 0.25

    if 17 <= now.hour <= 21:
        multiplier += 0.15

    final_price = round(base_price * multiplier, 2)

    return jsonify({
        "base_price": base_price,
        "final_price": final_price,
        "multiplier": multiplier
    })

@app.get("/provider")
def provider_page():
    return send_from_directory(FRONTEND_DIR, "provider.html")


@app.get("/dashboard")
def dashboard_page():
    return send_from_directory(FRONTEND_DIR, "dashboard.html")

@app.get("/")
def index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if not os.path.isfile(index_path):
        abort(404, description=f"index.html not found at {index_path}")
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "GlamMap AR Backend"})


@app.post("/api/analyze")
def analyze():
    """
    Accepts:  multipart/form-data with 'image' file  OR
               application/json with 'image_b64' base64 string
    """
    try:
        image_bytes = _read_image_from_request() or _read_base64_from_request()
        if not image_bytes:
            return jsonify({"success": False, "error": "No image provided"}), 400

        gender = _form_or_json("gender", "male")
        mode   = _form_or_json("mode", "face")

        if mode == "nails":
            hand_data = detect_hand_bytes(image_bytes)
            detected = "error" not in hand_data

            if not detected:
                return jsonify({
                    "success": True,
                    "detected": False,
                    "error": hand_data.get("error", "No hand detected"),
                })

            first_hand = hand_data["hands"][0]
            nail_shape = first_hand["nail_shape"]
            rec = recommend_nail_style(nail_shape, gender=gender)

            return jsonify({
                "success":        True,
                "detected":       True,
                "hands_detected": hand_data["hands_detected"],
                "nail_shape":     nail_shape,
                "nail_bboxes":    first_hand["nail_bboxes"],
                "recommendation": rec,
            })

        face_data = detect_face_bytes(image_bytes)
        detected = "error" not in face_data

        if not detected:
            return jsonify({
                "success": True,
                "detected": False,
                "error": face_data.get("error", "No face detected"),
            })

        rec = recommend_style(face_data, gender=gender)

        return jsonify({
            "success":        True,
            "detected":       True,
            "face_shape":    face_data["face_shape"],
            "roll_deg":      face_data["roll_deg"],
            "bboxes": {
                "hair":      face_data["hair_bbox"],
                "beard":     face_data["beard_bbox"],
                "moustache": face_data["moustache_bbox"],
            },
            "recommendation": rec,
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Internal analysis error"}), 500


@app.post("/api/ar")
def ar():
    """
    Composites an overlay onto the uploaded photo.
    """
    try:
        image_bytes = _read_image_from_request() or _read_base64_from_request()
        if not image_bytes:
            return jsonify({"success": False, "error": "No image provided"}), 400

        overlay_key = _form_or_json("overlay_key", "")
        overlay_path = _resolve_overlay_path(overlay_key)
        if overlay_path is None:
            return jsonify({
                "success": False,
                "error": f"Overlay asset not found for '{overlay_key}'",
            }), 404

        feature = _form_or_json("feature")
        if feature not in VALID_FEATURES:
            feature = overlay_key.split("/", 1)[0] if "/" in overlay_key else None

        bbox = _parse_bbox_form()

        try:
            angle_deg = float(request.form.get("angle_deg", 0) or 0)
        except (ValueError, TypeError):
            angle_deg = 0.0

        result_bytes = render_overlay_bytes(
            image_bytes, overlay_path,
            bbox=bbox, region=feature, angle_deg=angle_deg,
        )

        if result_bytes is None:
            return jsonify({"success": False, "error": "AR render failed"}), 500

        b64 = base64.b64encode(result_bytes).decode("utf-8")
        return jsonify({
            "success":   True,
            "image_b64": f"data:image/jpeg;base64,{b64}",
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Internal AR render error"}), 500


@app.post("/api/providers/register")
def register_provider():
    data = request.get_json()

    provider = Provider(
        business_name=data["business_name"],
        provider_type=data["provider_type"],
        owner_name=data["owner_name"],
        email=data["email"],
        phone=data["phone"],
        password=data["password"],
        city=data["city"],
        area=data["area"],
        address=data["address"],
        subscription_tier=data.get("subscription_tier", "free")
    )

    db.session.add(provider)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Provider registered"
    })


# ── STEP 3 — Add Service APIs ───────────────────────────────────────────────

@app.post("/api/services/add")
def add_service():
    data = request.get_json()

    service = Service(
        provider_id=data["provider_id"],
        service_name=data["service_name"],
        price=data["price"],
        duration=data["duration"]
    )

    db.session.add(service)
    db.session.commit()

    return jsonify({"success": True})


@app.get("/api/services/<int:provider_id>")
def get_services(provider_id):
    services = Service.query.filter_by(provider_id=provider_id).all()
    result = []

    for s in services:
        result.append({
            "id": s.id,
            "service_name": s.service_name,
            "price": s.price,
            "duration": s.duration
        })

    return jsonify(result)


# ── STEP 4 — Add Slot APIs ──────────────────────────────────────────────────

@app.post("/api/slots/add")
def add_slot():
    data = request.get_json()

    slot = Slot(
        provider_id=data["provider_id"],
        date=data["date"],
        time=data["time"]
    )

    db.session.add(slot)
    db.session.commit()

    return jsonify({"success": True})


@app.get("/api/slots/<int:provider_id>")
def get_slots(provider_id):
    slots = Slot.query.filter_by(
        provider_id=provider_id,
        is_booked=False
    ).all()
    result = []

    for s in slots:
        result.append({
            "id": s.id,
            "date": s.date,
            "time": s.time
        })

    return jsonify(result)


# ── STEP 5 — Booking API ────────────────────────────────────────────────────

@app.post("/api/book")
def book_slot():
    data = request.get_json()
    slot = Slot.query.get(data["slot_id"])

    if not slot or slot.is_booked:
        return jsonify({
            "success": False,
            "message": "Slot already booked or invalid"
        })

    slot.is_booked = True

    booking = Booking(
        provider_id=slot.provider_id,
        customer_name=data["customer_name"],
        service_name=data["service_name"],
        booking_date=slot.date,
        slot_time=slot.time
    )

    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Booking successful"
    })

# ── Demand Prediction API ──────────────────────────────────────────────────

@app.get("/api/ai/predict-demand")
def predict_demand():
    try:
        day = int(request.args.get("day", 1))

        predicted = demand_model.predict([[day]])[0]

        return jsonify({
            "success": True,
            "predicted_bookings": round(float(predicted), 2)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

# ── Dynamic Pricing API ────────────────────────────────────────────────────

@app.post("/api/ai/dynamic-price")
def dynamic_price():
    try:
        data = request.get_json()

        base_price = float(data["base_price"])
        weekend = int(data["weekend"])   # 0 or 1

        multiplier = price_model.predict([[weekend]])[0]
        final_price = base_price * multiplier

        return jsonify({
            "success": True,
            "multiplier": round(float(multiplier), 2),
            "final_price": round(float(final_price), 2)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


# ── Context & Database Init ─────────────────────────────────────────────────
with app.app_context():
    db.create_all()  # --- UPDATED: Clean database initialization ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"GlamMap backend running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)