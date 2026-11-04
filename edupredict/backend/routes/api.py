import json
from collections import Counter

from flask import Blueprint, current_app, g, jsonify, request

from auth import login_required
from extensions import db
from ml.constants import CATEGORIES, FEATURES
from models import Assessment, User
from validators import ValidationError, validate_prediction_input

bp = Blueprint("api", __name__, url_prefix="/api")


def _predictor():
    return current_app.extensions["predictor"]


def _run_prediction():
    try:
        features, subjects, term = validate_prediction_input(request.get_json(silent=True))
    except ValidationError as e:
        return None, (jsonify(error="Please fix the highlighted fields.", fields=e.errors), 400)
    return (features, subjects, term, _predictor().predict(features, subjects)), None


@bp.get("/health")
def health():
    return jsonify(status="ok", model=_predictor().meta.get("best_model"))


# ---------- predictions ------------------------------------------------------
@bp.post("/predict")
@login_required()
def predict():
    """Quick what-if prediction. Nothing is saved."""
    out, err = _run_prediction()
    if err:
        return err
    return jsonify(result=out[3])


@bp.post("/assessments")
@login_required("student")
def create_assessment():
    out, err = _run_prediction()
    if err:
        return err
    features, subjects, term, result = out
    count = g.user.assessments.count()
    a = Assessment(
        user_id=g.user.id, term_label=term or f"Assessment {count + 1}",
        category=result["category"], risk_index=result["risk_index"],
        result_json=json.dumps({**result, "subject_inputs": subjects}), **features,
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(assessment=a.to_dict()), 201


@bp.get("/assessments")
@login_required("student")
def list_assessments():
    rows = g.user.assessments.order_by(Assessment.created_at.asc(), Assessment.id.asc()).all()
    return jsonify(assessments=[a.to_dict(full=False) for a in rows])


@bp.get("/assessments/<int:aid>")
@login_required()
def get_assessment(aid):
    a = db.session.get(Assessment, aid)
    if not a or (g.user.role == "student" and a.user_id != g.user.id):
        return jsonify(error="Assessment not found."), 404
    return jsonify(assessment=a.to_dict())


@bp.delete("/assessments/<int:aid>")
@login_required("student")
def delete_assessment(aid):
    a = db.session.get(Assessment, aid)
    if not a or a.user_id != g.user.id:
        return jsonify(error="Assessment not found."), 404
    db.session.delete(a)
    db.session.commit()
    return jsonify(ok=True)


@bp.get("/model/info")
@login_required()
def model_info():
    return jsonify(info=_predictor().meta)


# ---------- teacher ----------------------------------------------------------
def _latest(user):
    return user.assessments.order_by(Assessment.created_at.desc(), Assessment.id.desc()).first()


def _student_row(u):
    latest, count = _latest(u), u.assessments.count()
    prev = None
    if count > 1:
        prev = u.assessments.order_by(Assessment.created_at.desc(), Assessment.id.desc()).offset(1).first()
    trend = None
    if latest and prev:
        diff = latest.risk_index - prev.risk_index
        trend = "improving" if diff > 0.15 else "declining" if diff < -0.15 else "steady"
    return {
        **u.to_dict(), "assessment_count": count, "trend": trend,
        "latest": latest.to_dict(full=False) if latest else None,
    }


@bp.get("/teacher/students")
@login_required("teacher")
def teacher_students():
    q = request.args.get("q", "").strip().lower()
    cat = request.args.get("category")
    rows = []
    for u in User.query.filter_by(role="student").order_by(User.name).all():
        if q and q not in u.name.lower() and q not in u.email:
            continue
        row = _student_row(u)
        if cat and (not row["latest"] or row["latest"]["category"] != cat):
            continue
        rows.append(row)
    return jsonify(students=rows)


@bp.get("/teacher/summary")
@login_required("teacher")
def teacher_summary():
    students = User.query.filter_by(role="student").all()
    latest = [a for a in (_latest(u) for u in students) if a]
    counts = Counter(a.category for a in latest)
    n = len(latest) or 1
    return jsonify(summary={
        "total_students": len(students),
        "assessed_students": len(latest),
        "distribution": [{"category": c, "count": counts.get(c, 0)} for c in CATEGORIES],
        "averages": {f: round(sum(getattr(a, f) for a in latest) / n, 1) for f in FEATURES},
        "at_risk": counts.get("At Risk", 0),
    })


@bp.get("/teacher/students/<int:uid>")
@login_required("teacher")
def teacher_student_detail(uid):
    u = db.session.get(User, uid)
    if not u or u.role != "student":
        return jsonify(error="Student not found."), 404
    rows = u.assessments.order_by(Assessment.created_at.asc(), Assessment.id.asc()).all()
    return jsonify(student=u.to_dict(), assessments=[a.to_dict() for a in rows])
