import cv2
import numpy as np
 
 
# ── Feature-aware fallback boxes (only used when no real bbox is passed) ──
_FALLBACK_REGIONS = {
    "hair":      {"wf": 0.62, "hf": 0.32, "yf": 0.02},
    "beard":     {"wf": 0.32, "hf": 0.20, "yf": 0.55},
    "moustache": {"wf": 0.20, "hf": 0.08, "yf": 0.46},
    "nails":     {"wf": 0.10, "hf": 0.10, "yf": 0.40},
    None:        {"wf": 0.55, "hf": 0.55, "yf": 0.08},
}
 
 
def _fallback_bbox(img_w, img_h, region):
    cfg = _FALLBACK_REGIONS.get(region, _FALLBACK_REGIONS[None])
    ow, oh = int(img_w * cfg["wf"]), int(img_h * cfg["hf"])
    return {"x": (img_w - ow) // 2, "y": int(img_h * cfg["yf"]), "w": ow, "h": oh}
 
 
def _ensure_alpha(overlay):
    """Add an opaque alpha channel if the overlay PNG doesn't have one."""
    if overlay.shape[2] == 3:
        return cv2.cvtColor(overlay, cv2.COLOR_BGR2BGRA)
    return overlay
 
 
def _fit_resize(overlay, target_w, target_h):
    """Scale overlay to fit INSIDE target_w x target_h, preserving aspect
    ratio — never stretches the artwork."""
    oh, ow = overlay.shape[:2]
    if ow == 0 or oh == 0:
        return overlay
    scale = min(target_w / ow, target_h / oh)
    new_w, new_h = max(int(ow * scale), 1), max(int(oh * scale), 1)
    return cv2.resize(overlay, (new_w, new_h), interpolation=cv2.INTER_AREA)
 
 
def _rotate_overlay(overlay, angle_deg):
    """Rotate a BGRA overlay around its own center, padding with full
    transparency so the canvas stays the same size."""
    if not angle_deg:
        return overlay
    h, w = overlay.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle_deg, 1.0)
    return cv2.warpAffine(
        overlay, M, (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
 
 
def _composite(image, overlay, bbox, region, angle_deg):
    """Core blend step shared by both public entry points below."""
    img_h, img_w = image.shape[:2]
 
    if bbox and all(k in bbox for k in ("x", "y", "w", "h")):
        x = max(0, int(bbox["x"]))
        y = max(0, int(bbox["y"]))
        ow = min(int(bbox["w"]), img_w - x)
        oh = min(int(bbox["h"]), img_h - y)
    else:
        fb = _fallback_bbox(img_w, img_h, region)
        x, y, ow, oh = fb["x"], fb["y"], fb["w"], fb["h"]
 
    if ow <= 0 or oh <= 0:
        return image
 
    overlay = _ensure_alpha(overlay)
    fitted = _fit_resize(overlay, ow, oh)
    fitted = _rotate_overlay(fitted, angle_deg)
    fh, fw = fitted.shape[:2]
 
    # Center the (aspect-correct) fitted overlay inside the target box,
    # then clamp so it never falls off the edge of the source photo.
    off_x = x + (ow - fw) // 2
    off_y = y + (oh - fh) // 2
    off_x = max(0, min(off_x, img_w - fw)) if img_w > fw else 0
    off_y = max(0, min(off_y, img_h - fh)) if img_h > fh else 0
    fw = min(fw, img_w - off_x)
    fh = min(fh, img_h - off_y)
    fitted = fitted[:fh, :fw]
 
    alpha = fitted[:, :, 3:4].astype(np.float32) / 255.0
    rgb_overlay = fitted[:, :, :3].astype(np.float32)
    region_slice = image[off_y:off_y + fh, off_x:off_x + fw].astype(np.float32)
    blended = region_slice * (1 - alpha) + rgb_overlay * alpha
    image[off_y:off_y + fh, off_x:off_x + fw] = blended.astype(np.uint8)
    return image
 
 
def render_overlay(image_path: str, overlay_path: str, bbox: dict = None,
                    region: str = None, angle_deg: float = 0.0):
    """
    Composite overlay_path onto image_path, positioned at bbox.
 
    bbox:      {"x","y","w","h"} from face_detector/hand_detector — pass
               hair_bbox / beard_bbox / moustache_bbox / a nail_bboxes entry.
    region:    "hair" | "beard" | "moustache" | "nails" — used only to pick
               a sane fallback box if bbox is None.
    angle_deg: head roll_deg or a nail_bbox's "angle" — rotates the overlay
               to match the photo instead of always pasting it upright.
    """
    image = cv2.imread(image_path)
    overlay = cv2.imread(overlay_path, cv2.IMREAD_UNCHANGED)
 
    if image is None:
        print(f"ar_renderer: could not read image at {image_path}")
        return None
    if overlay is None:
        print(f"ar_renderer: could not read overlay at {overlay_path}")
        return None
 
    return _composite(image, overlay, bbox, region, angle_deg)
 
 
def render_overlay_bytes(image_bytes: bytes, overlay_path: str, bbox: dict = None,
                          region: str = None, angle_deg: float = 0.0):
    """Same as render_overlay but accepts raw image bytes (for the Flask
    route) and returns JPEG bytes instead of writing to disk."""
    import io
    from PIL import Image
 
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
 
    overlay = cv2.imread(overlay_path, cv2.IMREAD_UNCHANGED)
    if overlay is None:
        _, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 88])
        return buf.tobytes()
 
    image = _composite(image, overlay, bbox, region, angle_deg)
    _, buf = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return buf.tobytes()
 