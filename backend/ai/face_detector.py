"""
face_detector.py — GlamMap

  This version returns, in one call:
    - face_shape          (unchanged classifier, made scale-invariant)
    - roll_deg             head tilt, used to rotate overlays to match pose
    - hair_bbox             region above the hairline, for hairstyle overlays
    - beard_bbox            jaw/chin region, for beard overlays
    - moustache_bbox        lip region, for moustache overlays
"""

import cv2
import mediapipe as mp
import math

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True
)


# ── Helpers ─────────────────────────────────────────────────────────────
def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def landmark_to_pixel(landmark, width, height):
    return (int(landmark.x * width), int(landmark.y * height))


def classify_face_shape(face_width, jaw_width, face_length):
    ratio = face_length / face_width if face_width else 1.0

    if ratio > 1.5:
        return "Oblong"

    # was a fixed 20px threshold — not scale-invariant across photo
    # resolutions (20px is nothing on a 4000px photo, huge on a 400px one).
    # Use a ratio of face_width instead.
    if abs(face_width - jaw_width) < face_width * 0.08:
        return "Square"

    if jaw_width < face_width * 0.8:
        return "Heart"

    return "Oval"


# ── Main entry point ───────────────────────────────────────────────────
def detect_face(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Image not found"}

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)
    if not results.multi_face_landmarks:
        return {"error": "No face detected"}

    landmarks = results.multi_face_landmarks[0].landmark
    height, width = img.shape[:2]
    pt = lambda i: landmark_to_pixel(landmarks[i], width, height)

    forehead    = pt(10)    # hairline center
    chin        = pt(152)
    left_cheek  = pt(234)
    right_cheek = pt(454)
    jaw_left    = pt(172)
    jaw_right   = pt(397)
    mouth_left  = pt(61)
    mouth_right = pt(291)
    lip_top     = pt(13)
    nose_base   = pt(2)
    eye_left    = pt(33)    # outer corner, left eye
    eye_right   = pt(263)   # outer corner, right eye

    face_width  = distance(left_cheek, right_cheek)
    jaw_width   = distance(jaw_left, jaw_right)
    face_length = distance(forehead, chin)

    face_shape = classify_face_shape(face_width, jaw_width, face_length)

    # Head roll (tilt), so overlays can be rotated to match the photo
    # instead of always being pasted perfectly upright.
    roll_deg = math.degrees(
        math.atan2(eye_right[1] - eye_left[1], eye_right[0] - eye_left[0])
    )

    # ── Hair / hairline region ──────────────────────────────────────
    # MediaPipe doesn't track scalp above the hairline landmark, so we
    # extrapolate upward using face_length as the scale reference.
    hair_h = int(face_length * 0.55)
    hair_w = int(face_width * 1.05)
    hair_bbox = {
        "x": int(forehead[0] - hair_w / 2),
        "y": int(forehead[1] - hair_h),
        "w": hair_w,
        "h": hair_h,
    }

    # ── Beard / jaw region ───────────────────────────────────────────
    # Starts just below the mouth, runs down past the chin.
    beard_w = int(jaw_width * 1.1)
    beard_top = mouth_left[1]
    beard_bottom = int(chin[1] + face_length * 0.08)
    beard_bbox = {
        "x": int((jaw_left[0] + jaw_right[0]) / 2 - beard_w / 2),
        "y": beard_top,
        "w": beard_w,
        "h": max(beard_bottom - beard_top, 1),
    }

    # ── Moustache / lip region ────────────────────────────────────────
    mst_w = int(distance(mouth_left, mouth_right) * 1.15)
    mst_h = int(distance(nose_base, lip_top) * 2.2)
    moustache_bbox = {
        "x": int((mouth_left[0] + mouth_right[0]) / 2 - mst_w / 2),
        "y": nose_base[1],
        "w": mst_w,
        "h": max(mst_h, 1),
    }

    return {
        "width": width,
        "height": height,
        "face_shape": face_shape,
        "roll_deg": round(roll_deg, 2),
        "hair_bbox": hair_bbox,
        "beard_bbox": beard_bbox,
        "moustache_bbox": moustache_bbox,
    }


# ── Bytes-based entry point (called by app.py) ────────────────────────
def detect_face_bytes(image_bytes: bytes) -> dict:
    import tempfile, os
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        result = detect_face(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
    return result