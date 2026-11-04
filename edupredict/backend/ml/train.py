"""Train Decision Tree, Random Forest and Logistic Regression; keep the best.

Usage:
    python -m ml.train                       # synthetic data
    python -m ml.train --data students.csv   # real data (needs FEATURES + final_score or category)
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from ml.constants import CATEGORIES, FEATURES, score_to_category_index
from ml.generate_data import generate

SEED = 42


def build_models():
    return {
        "Decision Tree": DecisionTreeClassifier(
            max_depth=6, min_samples_leaf=10, class_weight="balanced", random_state=SEED),
        "Random Forest": RandomForestClassifier(
            n_estimators=250, max_depth=10, min_samples_leaf=3,
            class_weight="balanced_subsample", n_jobs=-1, random_state=SEED),
        "Logistic Regression": Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced")),
        ]),
    }


def load_data(path=None, n=3000):
    if path is None:
        return generate(n=n, seed=SEED), "synthetic"
    df = pd.read_csv(path)
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")
    if "category" not in df.columns:
        if "final_score" not in df.columns:
            raise ValueError("CSV needs a 'category' or 'final_score' column.")
        df["category"] = df["final_score"].map(score_to_category_index)
    elif df["category"].dtype == object:
        df["category"] = df["category"].map({c: i for i, c in enumerate(CATEGORIES)})
    df = df.dropna(subset=FEATURES + ["category"])
    df["category"] = df["category"].astype(int)
    return df, Path(path).name


def feature_importance(model):
    clf = model.named_steps["clf"] if isinstance(model, Pipeline) else model
    if hasattr(clf, "feature_importances_"):
        imp = clf.feature_importances_
    else:  # logistic regression: mean |coefficient| on standardised inputs
        imp = np.abs(clf.coef_).mean(axis=0)
    imp = imp / imp.sum()
    return {f: round(float(v), 4) for f, v in zip(FEATURES, imp)}


def train(out_dir, data=None, n=3000, verbose=False):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    df, source = load_data(data, n)
    X, y = df[FEATURES], df["category"]
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    results, fitted = {}, {}
    for name, model in build_models().items():
        cv_f1 = cross_val_score(model, X_tr, y_tr, cv=cv, scoring="f1_macro")
        model.fit(X_tr, y_tr)
        pred = model.predict(X_te)
        results[name] = {
            "cv_f1_macro_mean": round(float(cv_f1.mean()), 4),
            "cv_f1_macro_std": round(float(cv_f1.std()), 4),
            "test_accuracy": round(float(accuracy_score(y_te, pred)), 4),
            "test_f1_macro": round(float(f1_score(y_te, pred, average="macro")), 4),
            "confusion_matrix": confusion_matrix(y_te, pred, labels=range(4)).tolist(),
            "per_class": classification_report(
                y_te, pred, labels=range(4), target_names=CATEGORIES,
                output_dict=True, zero_division=0),
            "feature_importance": feature_importance(model),
        }
        fitted[name] = model
        if verbose:
            r = results[name]
            print(f"{name:20s} CV F1 {r['cv_f1_macro_mean']:.3f}  "
                  f"test acc {r['test_accuracy']:.3f}  test F1 {r['test_f1_macro']:.3f}")

    best = max(results, key=lambda k: results[k]["cv_f1_macro_mean"])
    joblib.dump(fitted[best], out_dir / "model.joblib")
    meta = {
        "best_model": best,
        "features": FEATURES,
        "categories": CATEGORIES,
        "data_source": source,
        "n_samples": int(len(df)),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "models": results,
        "note": ("Trained on simulated data. Replace with real historical records "
                 "before relying on results." if source == "synthetic" else
                 "Trained on supplied historical data."),
    }
    (out_dir / "metrics.json").write_text(json.dumps(meta, indent=2))
    if verbose:
        print(f"\nBest model (by CV macro-F1): {best} -> saved to {out_dir}")
    return meta


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", help="CSV of historical student records")
    ap.add_argument("--out", default=str(Path(__file__).parent / "artifacts"))
    ap.add_argument("--n", type=int, default=3000, help="synthetic sample count")
    a = ap.parse_args()
    train(a.out, a.data, a.n, verbose=True)
