from scoring_rules import FACE_RULES, NAIL_RULES
 
 
def recommend_style(face_data: dict, gender: str = "male", selected_styles: dict = None) -> dict:
    """
    face_data:       dict from face_detector.detect_face() — must contain "face_shape"
    gender:          "male" | "female"
    selected_styles: dict of user's explicit choices (override recommendations)
 
    Returns:
    { "face_shape", "beard", "moustache", "hair", "nails", "reason" }
    """
    selected_styles = selected_styles or {}
    shape = face_data.get("face_shape", "Oval").capitalize()
    rules = FACE_RULES.get(shape, FACE_RULES["Oval"])
 
    if gender == "female":
        return {
            "face_shape": shape,
            "beard":      None,
            "moustache":  None,
            "hair":       selected_styles.get("hair")  or rules["hair_f"],
            "nails":      selected_styles.get("nails") or rules["nails"],
            "reason":     rules.get("reason_f", f"{shape} face shape detected."),
        }
 
    return {
        "face_shape": shape,
        "beard":      selected_styles.get("beard")     or rules["beard"],
        "moustache":  selected_styles.get("moustache") or rules["moustache"],
        "hair":       selected_styles.get("hair")      or rules["hair_m"],
        "nails":      None,
        "reason":     rules.get("reason_m", f"{shape} face shape detected."),
    }
 
 
def recommend_nail_style(nail_shape: str, gender: str = "female", selected_style: str = None) -> dict:
    """
    nail_shape:      the value hand_detector.detect_hand()'s nail_shape field
                      returns for the first detected hand (e.g. "Almond").
    selected_style:   user's explicit override, if they picked a style manually.
 
    Returns:
    { "detected_nail_shape", "recommended_shape", "recommended_manicure", "reason" }
    """
    rules = NAIL_RULES.get(nail_shape, NAIL_RULES["Oval"])
    return {
        "detected_nail_shape":  nail_shape,
        "recommended_shape":    selected_style or rules["shape"],
        "recommended_manicure": rules["manicure"],
        "reason":                rules["reason"],
    }
 