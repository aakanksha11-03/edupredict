import json
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


def _now():
    return datetime.now(timezone.utc)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="student")  # student | teacher
    created_at = db.Column(db.DateTime, default=_now)
    assessments = db.relationship(
        "Assessment", backref="user", cascade="all, delete-orphan", lazy="dynamic"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    term_label = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, default=_now)

    attendance = db.Column(db.Float, nullable=False)
    internal_marks = db.Column(db.Float, nullable=False)
    study_hours = db.Column(db.Float, nullable=False)
    assignment_score = db.Column(db.Float, nullable=False)
    previous_score = db.Column(db.Float, nullable=False)

    category = db.Column(db.String(20), nullable=False)
    risk_index = db.Column(db.Float, nullable=False)  # expected level 0..3
    result_json = db.Column(db.Text, nullable=False)  # full prediction payload

    def to_dict(self, full=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "term_label": self.term_label,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "inputs": {
                "attendance": self.attendance,
                "internal_marks": self.internal_marks,
                "study_hours": self.study_hours,
                "assignment_score": self.assignment_score,
                "previous_score": self.previous_score,
            },
            "category": self.category,
            "risk_index": self.risk_index,
        }
        if full:
            data["result"] = json.loads(self.result_json)
        return data
