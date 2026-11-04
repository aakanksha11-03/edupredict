"""Input validation for prediction requests."""

FIELD_RULES = {
    # name: (min, max, required)
    "attendance": (0, 100, True),
    "internal_marks": (0, 100, True),
    "study_hours": (0, 80, True),
    "assignment_score": (0, 100, True),
    "previous_score": (0, 100, False),  # defaults to internal_marks
}


class ValidationError(Exception):
    def __init__(self, errors):
        super().__init__("Validation failed")
        self.errors = errors


def _number(value):
    if isinstance(value, bool):
        raise ValueError
    return float(value)


def validate_prediction_input(payload):
    """Return (features, subjects, term_label). Raises ValidationError."""
    if not isinstance(payload, dict):
        raise ValidationError({"_": "Request body must be a JSON object."})

    errors, features = {}, {}
    for name, (lo, hi, required) in FIELD_RULES.items():
        raw = payload.get(name)
        if raw in (None, ""):
            if required:
                errors[name] = "This field is required."
            continue
        try:
            val = _number(raw)
        except (TypeError, ValueError):
            errors[name] = "Must be a number."
            continue
        if val != val or not (lo <= val <= hi):  # NaN or out of range
            errors[name] = f"Must be between {lo} and {hi}."
            continue
        features[name] = val

    if "previous_score" not in features and "internal_marks" in features:
        features["previous_score"] = features["internal_marks"]

    subjects = []
    raw_subjects = payload.get("subjects") or []
    if not isinstance(raw_subjects, list) or len(raw_subjects) > 15:
        errors["subjects"] = "Provide a list of at most 15 subjects."
    else:
        seen = set()
        for i, s in enumerate(raw_subjects):
            key = f"subjects[{i}]"
            if not isinstance(s, dict):
                errors[key] = "Each subject needs a name and marks."
                continue
            name = str(s.get("name", "")).strip()[:60]
            try:
                marks = _number(s.get("marks"))
            except (TypeError, ValueError):
                errors[key] = "Marks must be a number."
                continue
            if not name:
                errors[key] = "Subject name is required."
            elif name.lower() in seen:
                errors[key] = f"Duplicate subject '{name}'."
            elif not 0 <= marks <= 100:
                errors[key] = "Marks must be between 0 and 100."
            else:
                seen.add(name.lower())
                subjects.append({"name": name, "marks": marks})

    term_label = str(payload.get("term_label") or "").strip()[:60]

    if errors:
        raise ValidationError(errors)
    return features, subjects, term_label
