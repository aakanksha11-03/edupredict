import functools
from datetime import datetime, timedelta, timezone

import jwt
from flask import Blueprint, current_app, g, jsonify, request

from extensions import db
from models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def make_token(user):
    exp = datetime.now(timezone.utc) + timedelta(hours=current_app.config["TOKEN_HOURS"])
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": exp},
                      current_app.config["SECRET_KEY"], algorithm="HS256")


def login_required(*roles):
    """Decorator: require a valid Bearer token, optionally restricted to roles."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                return jsonify(error="Authentication required."), 401
            try:
                data = jwt.decode(header[7:], current_app.config["SECRET_KEY"],
                                  algorithms=["HS256"])
                user = db.session.get(User, int(data["sub"]))
            except (jwt.PyJWTError, KeyError, ValueError):
                return jsonify(error="Session expired or invalid. Please sign in again."), 401
            if not user:
                return jsonify(error="Account not found."), 401
            if roles and user.role not in roles:
                return jsonify(error="You don't have permission to do that."), 403
            g.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


@bp.post("/register")
def register():
    d = request.get_json(silent=True) or {}
    name = str(d.get("name", "")).strip()
    email = str(d.get("email", "")).strip().lower()
    password = str(d.get("password", ""))
    role = d.get("role", "student")
    errors = {}
    if len(name) < 2:
        errors["name"] = "Enter your full name."
    if "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Enter a valid email address."
    if len(password) < 8:
        errors["password"] = "Use at least 8 characters."
    if role not in ("student", "teacher"):
        errors["role"] = "Role must be student or teacher."
    elif role == "teacher" and d.get("invite_code") != current_app.config["TEACHER_INVITE_CODE"]:
        errors["invite_code"] = "Invalid teacher invite code."
    if not errors and User.query.filter_by(email=email).first():
        errors["email"] = "An account with this email already exists."
    if errors:
        return jsonify(error="Please fix the highlighted fields.", fields=errors), 400

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(token=make_token(user), user=user.to_dict()), 201


@bp.post("/login")
def login():
    d = request.get_json(silent=True) or {}
    user = User.query.filter_by(email=str(d.get("email", "")).strip().lower()).first()
    if not user or not user.check_password(str(d.get("password", ""))):
        return jsonify(error="Incorrect email or password."), 401
    return jsonify(token=make_token(user), user=user.to_dict())


@bp.get("/me")
@login_required()
def me():
    return jsonify(user=g.user.to_dict())
