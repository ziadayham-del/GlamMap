"""
hand_detector.py — GlamMap

FIX (this version):
  The old detect_hand() computed finger tip/base coordinates and lengths,
  then summarized them into a single "average_finger_length" / "nail_shape"
  guess — but never returned a per-fingertip box. ar_renderer had nothing
  to anchor nail-art overlays to, so (like the face case) it fell back to
  one generic centered box for all five nails at once.

  This version adds, per finger: a small rotated bounding box centered on
  the fingertip ("nail_bboxes"), sized relative to that finger's own
  length and angled to match the finger's actual direction in the photo —
  so a ring-finger nail isn't pasted at the same size/angle as a thumb.
"""

import cv2
import mediapipe as mp
import math

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5
)


# ── Helpers ─────────────────────────────────────────────────────────────
def landmark_to_pixel(landmark, width, height):
    return (int(landmark.x * width), int(landmark.y * height))


def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def classify_nail_shape(length, width):
    if width == 0:
        return "Unknown"
    ratio = length / width
    if ratio < 1.2:
        return "Square"
    elif ratio < 1.5:
        return "Oval"
    elif ratio < 1.8:
        return "Almond"
    else:
        return "Stiletto"


def _nail_bbox(tip, base, width_ratio=0.55, length_ratio=0.45):
    """
    Build a small bounding box for a single nail, centered on the
    fingertip, sized from that finger's own tip-to-base distance, and
    angled to match the direction the finger is actually pointing.
    """
    length = distance(tip, base)
    w = max(int(length * width_ratio), 6)
    h = max(int(length * length_ratio), 6)
    angle = math.degrees(math.atan2(tip[1] - base[1], tip[0] - base[0]))
    return {
        "x": int(tip[0] - w / 2),
        "y": int(tip[1] - h / 2),
        "w": w,
        "h": h,
        "angle": round(angle + 90, 1),  # +90 so 0° = nail pointing "up" the finger
    }


# ── Main entry point ───────────────────────────────────────────────────
def detect_hand(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Image not found"}

    height, width = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    if not results.multi_hand_landmarks:
        return {"error": "No hand detected"}

    detected_hands = []

    for hand_landmarks in results.multi_hand_landmarks:
        landmarks = hand_landmarks.landmark
        pt = lambda i: landmark_to_pixel(landmarks[i], width, height)

        wrist       = pt(0)
        thumb_tip,  thumb_ip   = pt(4),  pt(3)
        index_tip,  index_dip  = pt(8),  pt(7)
        middle_tip, middle_dip = pt(12), pt(11)
        ring_tip,   ring_dip   = pt(16), pt(15)
        pinky_tip,  pinky_dip  = pt(20), pt(19)

        index_length  = distance(index_tip, pt(5))
        middle_length = distance(middle_tip, pt(9))
        ring_length   = distance(ring_tip, pt(13))
        pinky_length  = distance(pinky_tip, pt(17))
        avg_length = (index_length + middle_length + ring_length + pinky_length) / 4
        estimated_nail_width = avg_length * 0.65
        nail_shape = classify_nail_shape(avg_length, estimated_nail_width)

        # Per-finger nail boxes — this is the part the renderer actually needs.
        nail_bboxes = {
            "thumb":  _nail_bbox(thumb_tip, thumb_ip, width_ratio=0.6, length_ratio=0.5),
            "index":  _nail_bbox(index_tip, index_dip),
            "middle": _nail_bbox(middle_tip, middle_dip),
            "ring":   _nail_bbox(ring_tip, ring_dip),
            "pinky":  _nail_bbox(pinky_tip, pinky_dip, width_ratio=0.5, length_ratio=0.4),
        }

        detected_hands.append({
            "wrist": wrist,
            "thumb_tip": thumb_tip,
            "finger_tips": {
                "index": index_tip, "middle": middle_tip,
                "ring": ring_tip, "pinky": pinky_tip,
            },
            "finger_lengths": {
                "index": round(index_length, 2), "middle": round(middle_length, 2),
                "ring": round(ring_length, 2), "pinky": round(pinky_length, 2),
            },
            "average_finger_length": round(avg_length, 2),
            "estimated_nail_width": round(estimated_nail_width, 2),
            "nail_shape": nail_shape,
            "nail_bboxes": nail_bboxes,
        })

    return {
        "image_width": width,
        "image_height": height,
        "hands_detected": len(detected_hands),
        "nails_detected": len(detected_hands) * 5,
        "hands": detected_hands,
    }


# ── Bytes-based entry point (called by app.py) ────────────────────────
def detect_hand_bytes(image_bytes: bytes) -> dict:
    import tempfile, os
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        result = detect_hand(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
    return result