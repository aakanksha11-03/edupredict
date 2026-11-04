import json
import random
from datetime import datetime, timedelta, timezone

import click
from flask import Flask, jsonify
from flask_cors import CORS

import auth
from config import Config
from extensions import db
from ml.predictor import Predictor
from models import Assessment, User
from routes.api import bp as api_bp


def create_app(overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)

    CORS(app, origins=app.config["CORS_ORIGINS"])
    db.init_app(app)
    app.register_blueprint(auth.bp)
    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()
    app.extensions["predictor"] = Predictor(app.config["MODEL_DIR"]).load()

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="Not found."), 404

    @app.errorhandler(405)
    def bad_method(_):
        return jsonify(error="Method not allowed."), 405

    @app.errorhandler(500)
    def server_error(_):
        return jsonify(error="Something went wrong on our side. Please try again."), 500

    register_cli(app)
    return app


def register_cli(app):
    @app.cli.command("seed-demo")
    def seed_demo():
        """Create a demo teacher and 8 students with 4 assessments each."""
        if User.query.filter_by(email="teacher@edupredict.test").first():
            click.echo("Demo data already exists.")
            return
        t = User(name="Demo Teacher", email="teacher@edupredict.test", role="teacher")
        t.set_password("Teacher@123")
        db.session.add(t)
        rng, predictor = random.Random(7), app.extensions["predictor"]
        names = ["Aarav Singh", "Meera Kaur", "Rohan Gill", "Simran Verma",
                 "Kabir Sharma", "Anaya Mehta", "Harpreet Dhillon", "Tanvi Joshi"]
        subjects = ["Mathematics", "Physics", "English", "Computer Science"]
        for i, name in enumerate(names):
            u = User(name=name, email=f"student{i + 1}@edupredict.test", role="student")
            u.set_password("Student@123")
            db.session.add(u)
            db.session.flush()
            base, slope = rng.uniform(45, 85), rng.uniform(-4, 6)
            for term in range(4):
                lvl = max(20, min(98, base + slope * term))
                f = {
                    "attendance": min(100, lvl + rng.uniform(2, 18)),
                    "internal_marks": min(100, lvl + rng.uniform(-8, 8)),
                    "study_hours": max(1, min(30, (lvl - 20) / 2.4 + rng.uniform(-2, 2))),
                    "assignment_score": min(100, lvl + rng.uniform(-8, 10)),
                    "previous_score": min(100, lvl - slope + rng.uniform(-6, 6)),
                }
                f = {k: round(v, 1) for k, v in f.items()}
                subs = [{"name": s, "marks": round(max(15, min(99, lvl + rng.uniform(-18, 18))), 1)}
                        for s in subjects]
                r = predictor.predict(f, subs)
                db.session.add(Assessment(
                    user_id=u.id, term_label=f"Term {term + 1}",
                    created_at=datetime.now(timezone.utc) - timedelta(days=30 * (3 - term)),
                    category=r["category"], risk_index=r["risk_index"],
                    result_json=json.dumps({**r, "subject_inputs": subs}), **f))
        db.session.commit()
        click.echo("Seeded. Teacher: teacher@edupredict.test / Teacher@123 | "
                   "Students: student1..8@edupredict.test / Student@123")


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
