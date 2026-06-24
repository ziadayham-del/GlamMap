FACE_RULES = {
    "Oval": {
        "beard":     "Corporate Beard",
        "moustache": "Chevron",
        "hair_m":    "Modern Pompadour",
        "hair_f":    "Beach Waves",
        "nails":     "Almond",
        "reason_m":  "Oval faces suit almost any style. Corporate Beard and Modern Pompadour add balanced polish.",
        "reason_f":  "Beach Waves complement oval faces by adding texture without disrupting symmetry.",
    },
    "Round": {
        "beard":     "Short Boxed Beard",
        "moustache": "Handlebar",
        "hair_m":    "High Fade",
        "hair_f":    "Layered Long Hair",
        "nails":     "Stiletto",
        "reason_m":  "Angular box structure and height on top slim and elongate round faces.",
        "reason_f":  "Long layers draw the eye vertically, reducing roundness.",
    },
    "Square": {
        "beard":     "Ducktail",
        "moustache": "Pencil Mustache",
        "hair_m":    "Textured Quiff",
        "hair_f":    "Curtain Bangs",
        "nails":     "Oval",
        "reason_m":  "The Ducktail's rounded base softens a strong square jaw elegantly.",
        "reason_f":  "Curtain Bangs soften a square hairline and add feminine framing.",
    },
    "Heart": {
        "beard":     "Goatee",
        "moustache": "Walrus",
        "hair_m":    "Curtains",
        "hair_f":    "Classic Bob",
        "nails":     "Coffin / Ballerina",
        "reason_m":  "A goatee adds chin weight to balance a wider forehead.",
        "reason_f":  "A chin-length bob adds jaw width, counterbalancing a narrower chin.",
    },
    "Oblong": {
        "beard":     "Mutton Chops",
        "moustache": "Bushy Mustache",
        "hair_m":    "Crew Cut",
        "hair_f":    "Full Bangs",
        "nails":     "Square",
        "reason_m":  "Side-focused beard and flat top keep width without adding unwanted length.",
        "reason_f":  "Full bangs shorten perceived face length for better balance.",
    },
    "Diamond": {
        "beard":     "Chin Strap",
        "moustache": "Natural Mustache",
        "hair_m":    "Comb Over",
        "hair_f":    "Half-Up Half-Down",
        "nails":     "Round",
        "reason_m":  "Chin strap frames the jaw without widening the already-prominent midface.",
        "reason_f":  "Half-up adds gentle forehead width while keeping the chin area soft.",
    },
}
 
# Keyed by the nail_shape classifier already in hand_detector.py
# (Square / Oval / Almond / Stiletto), independent of face shape.
NAIL_RULES = {
    "Square": {
        "shape":   "Squoval",
        "manicure": "Gel Manicure",
        "reason":  "Your nail bed reads square — Squoval keeps the strong, low-maintenance tip but softens the corners so it doesn't look blunt.",
    },
    "Oval": {
        "shape":   "Almond",
        "manicure": "Classic Manicure",
        "reason":  "Your nail bed is naturally oval — Almond elongates that shape further for a soft, polished look.",
    },
    "Almond": {
        "shape":   "Coffin / Ballerina",
        "manicure": "Gel Manicure",
        "reason":  "You already have an almond taper — Coffin extends that same line into a more dramatic, modern silhouette.",
    },
    "Stiletto": {
        "shape":   "Stiletto",
        "manicure": "Acrylic Nails",
        "reason":  "Your nail bed is narrow and tapered, which is exactly what a stiletto shape is built to show off.",
    },
}