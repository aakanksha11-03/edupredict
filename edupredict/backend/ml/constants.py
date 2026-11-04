FEATURES = ["attendance", "internal_marks", "study_hours", "assignment_score", "previous_score"]
CATEGORIES = ["At Risk", "Average", "Good", "Excellent"]

# Final-score thresholds used to label the (synthetic or real) training data.
THRESHOLDS = [50, 65, 80]  # <50 At Risk, 50-65 Average, 65-80 Good, >=80 Excellent

LABELS = {
    "attendance": "Attendance",
    "internal_marks": "Internal marks",
    "study_hours": "Weekly study hours",
    "assignment_score": "Assignment performance",
    "previous_score": "Previous term score",
}
UNITS = {
    "attendance": "%", "internal_marks": "%", "study_hours": " h/week",
    "assignment_score": "%", "previous_score": "%",
}
# Healthy target for each factor, and a "weak" reference value for what-if analysis.
BENCHMARKS = {
    "attendance": 85, "internal_marks": 75, "study_hours": 14,
    "assignment_score": 80, "previous_score": 75,
}
WEAK_REFERENCE = {
    "attendance": 60, "internal_marks": 50, "study_hours": 4,
    "assignment_score": 50, "previous_score": 50,
}


def score_to_category_index(score):
    for i, t in enumerate(THRESHOLDS):
        if score < t:
            return i
    return len(THRESHOLDS)
