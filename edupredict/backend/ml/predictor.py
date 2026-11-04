"""Loads the trained model and turns a prediction into an explained result."""
import json
from pathlib import Path

import joblib
import pandas as pd

from ml.constants import (BENCHMARKS, CATEGORIES, FEATURES, LABELS, UNITS,
                          WEAK_REFERENCE)

DISCLAIMER = ("This is a statistical estimate based on patterns in past student data. "
              "It is not a guarantee of future results, and it should support — not "
              "replace — conversations with teachers and mentors.")

STRONG_MARK, WEAK_MARK = 75, 50  # subject classification thresholds


def _fmt(feature, value):
    v = int(value) if float(value).is_integer() else round(value, 1)
    return f"{v}{UNITS[feature]}"


class Predictor:
    def __init__(self, model_dir):
        self.model_dir = Path(model_dir)
        self.model = None
        self.meta = {}

    def load(self):
        model_path = self.model_dir / "model.joblib"
        if not model_path.exists():
            from ml.train import train  # first run: build a model automatically
            print(f"[EduPredict] No model found in {self.model_dir}; training one now…")
            train(self.model_dir)
        self.model = joblib.load(model_path)
        self.meta = json.loads((self.model_dir / "metrics.json").read_text())
        return self

    # ---- core model helpers -------------------------------------------------
    def _proba(self, features):
        row = pd.DataFrame([{f: features[f] for f in FEATURES}])
        probs = self.model.predict_proba(row)[0]
        full = [0.0] * len(CATEGORIES)
        for cls, p in zip(self.model.classes_, probs):
            full[int(cls)] = float(p)
        return full

    @staticmethod
    def _expected_level(probs):
        return sum(i * p for i, p in enumerate(probs))

    # ---- public API ---------------------------------------------------------
    def predict(self, features, subjects=None):
        probs = self._proba(features)
        idx = max(range(len(probs)), key=probs.__getitem__)
        level = self._expected_level(probs)
        factors = self._factors(features, level)
        subject_analysis = self._subjects(subjects or [])
        return {
            "category": CATEGORIES[idx],
            "confidence": round(probs[idx], 4),
            "probabilities": {c: round(p, 4) for c, p in zip(CATEGORIES, probs)},
            "risk_index": round(level, 3),  # 0 (At Risk) … 3 (Excellent)
            "factors": factors,
            "subjects": subject_analysis,
            "suggestions": self._suggestions(CATEGORIES[idx], features, factors, subject_analysis),
            "model": self.meta.get("best_model"),
            "disclaimer": DISCLAIMER,
        }

    def _factors(self, features, base_level):
        """What-if analysis: how much would the predicted level move if one
        factor were at a healthy target (or at a weak reference)?"""
        out = []
        for f in FEATURES:
            value, target, weak = features[f], BENCHMARKS[f], WEAK_REFERENCE[f]
            if value < target:
                alt = {**features, f: target}
                impact = self._expected_level(self._proba(alt)) - base_level
                kind = "negative" if impact > 0.02 else "neutral"
                detail = (f"{LABELS[f]} is {_fmt(f, value)} versus a healthy target of "
                          f"{_fmt(f, target)}.")
            else:
                alt = {**features, f: weak}
                impact = base_level - self._expected_level(self._proba(alt))
                kind = "positive" if impact > 0.02 else "neutral"
                detail = (f"{LABELS[f]} is {_fmt(f, value)}, at or above the target of "
                          f"{_fmt(f, target)}.")
            out.append({
                "feature": f, "label": LABELS[f], "value": value, "target": target,
                "impact": round(float(impact), 3), "kind": kind, "detail": detail,
            })
        out.sort(key=lambda d: d["impact"], reverse=True)
        return out

    @staticmethod
    def _subjects(subjects):
        res = []
        for s in subjects:
            m = s["marks"]
            status = "strength" if m >= STRONG_MARK else "weakness" if m < WEAK_MARK else "moderate"
            res.append({"name": s["name"], "marks": m, "status": status})
        res.sort(key=lambda d: d["marks"], reverse=True)
        return res

    @staticmethod
    def _suggestions(category, features, factors, subjects):
        tips = []
        if category == "At Risk":
            tips.append("Book a conversation with a teacher or mentor this week and share this "
                        "report — early support makes the biggest difference.")
        templates = {
            "attendance": "Aim for at least 85% attendance (currently {v}). Plan around the "
                          "classes you miss most often and catch up on notes the same day.",
            "internal_marks": "Internal marks are {v}. Review your last internal papers, list the "
                              "questions you lost marks on, and practise those topics first.",
            "study_hours": "You study about {v}. Build up gradually to 14 hours a week using "
                           "short, scheduled sessions (45–50 minutes with 10-minute breaks).",
            "assignment_score": "Assignments are averaging {v}. Start earlier, ask for feedback "
                                "on past submissions, and aim to submit before the deadline.",
            "previous_score": "Your previous term score was {v}. Revisit the topics that carried "
                              "over from last term — gaps there tend to compound.",
        }
        for fct in [x for x in factors if x["kind"] == "negative"][:3]:
            tips.append(templates[fct["feature"]].format(v=_fmt(fct["feature"], fct["value"])))
        for s in [x for x in subjects if x["status"] == "weakness"][:3]:
            tips.append(f"{s['name']} ({s['marks']:g}%) needs extra attention: revisit the "
                        "fundamentals, solve past questions, and ask your teacher for help on "
                        "the topics you find hardest.")
        strong = [x["name"] for x in subjects if x["status"] == "strength"]
        if strong:
            tips.append(f"You're doing well in {', '.join(strong[:3])}. Use the study habits that "
                        "work there in your weaker subjects, or help classmates to reinforce learning.")
        if category in ("Good", "Excellent") and not any(x["kind"] == "negative" for x in factors):
            tips.append("Keep your current routine steady and set a stretch goal, such as "
                        "improving your weakest subject by 5–10 marks.")
        if not tips:
            tips.append("Keep tracking your progress each term so changes are spotted early.")
        return tips
