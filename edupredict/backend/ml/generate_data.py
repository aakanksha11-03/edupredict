"""Generate a synthetic student dataset.

IMPORTANT: this data is simulated so the project runs out of the box. For real
use, export historical records from your institution (with the same columns plus
`final_score`) and train with:  python -m ml.train --data your_data.csv
"""
import numpy as np
import pandas as pd

from ml.constants import FEATURES, score_to_category_index


def generate(n=3000, seed=42):
    rng = np.random.default_rng(seed)
    ability = rng.normal(0, 1, n)  # hidden factor that links the observed features

    attendance = np.clip(78 + 8 * ability + rng.normal(0, 10, n), 30, 100)
    internal = np.clip(66 + 13 * ability + rng.normal(0, 8, n), 0, 100)
    assignment = np.clip(68 + 12 * ability + rng.normal(0, 10, n), 0, 100)
    study = np.clip(10 + 3.5 * ability + rng.normal(0, 4, n), 0, 40)
    previous = np.clip(65 + 13 * ability + rng.normal(0, 8, n), 0, 100)

    final = (
        0.25 * attendance + 0.30 * internal + 0.20 * assignment
        + 0.10 * previous + 0.15 * np.minimum(study, 25) / 25 * 100
        + rng.normal(0, 4, n)
    )
    final = np.clip(final, 0, 100)

    df = pd.DataFrame({
        "attendance": attendance.round(1),
        "internal_marks": internal.round(1),
        "study_hours": study.round(1),
        "assignment_score": assignment.round(1),
        "previous_score": previous.round(1),
        "final_score": final.round(1),
    })
    df["category"] = df["final_score"].map(score_to_category_index)
    return df[FEATURES + ["final_score", "category"]]


if __name__ == "__main__":
    out = generate()
    out.to_csv("synthetic_students.csv", index=False)
    print(out.describe().round(1))
    print(out["category"].value_counts().sort_index())
