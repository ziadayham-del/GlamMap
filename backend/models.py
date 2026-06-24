from datetime import datetime
from database import db

class Provider(db.Model):
    __tablename__ = "providers"

    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(200))
    provider_type = db.Column(db.String(50))
    owner_name = db.Column(db.String(150))
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    password = db.Column(db.String(255))

    city = db.Column(db.String(100))
    area = db.Column(db.String(100))
    address = db.Column(db.Text)

    subscription_tier = db.Column(db.String(50), default="free")
    rating = db.Column(db.Float, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    revenue = db.Column(db.Float, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, nullable=False)
    service_name = db.Column(db.String(100))
    price = db.Column(db.Float)
    duration = db.Column(db.Integer)


class Slot(db.Model):
    __tablename__ = "slots"

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(50))
    time = db.Column(db.String(50))
    is_booked = db.Column(db.Boolean, default=False)


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer)

    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))

    service_name = db.Column(db.String(100))
    booking_date = db.Column(db.String(50))
    slot_time = db.Column(db.String(50))

    price_paid = db.Column(db.Float)