from conftest import register

GOOD = {"attendance": 95, "internal_marks": 88, "study_hours": 18,
        "assignment_score": 90, "previous_score": 85}
WEAK = {"attendance": 45, "internal_marks": 32, "study_hours": 2,
        "assignment_score": 30, "previous_score": 35}


def test_auth_flow(client):
    r, h = register(client)
    assert r.status_code == 201
    assert client.get("/api/auth/me", headers=h).json["user"]["role"] == "student"
    assert register(client)[0].status_code == 400  # duplicate email
    bad = client.post("/api/auth/login", json={"email": "s@example.com", "password": "nope"})
    assert bad.status_code == 401


def test_teacher_needs_invite_code(client):
    assert register(client, "teacher", "t@example.com")[0].status_code == 400
    assert register(client, "teacher", "t@example.com", invite_code="TEACH-2025")[0].status_code == 201


def test_prediction_orders_categories(client):
    _, h = register(client)
    good = client.post("/api/predict", json=GOOD, headers=h).json["result"]
    weak = client.post("/api/predict", json=WEAK, headers=h).json["result"]
    assert good["category"] in ("Good", "Excellent")
    assert weak["category"] in ("At Risk", "Average")
    assert good["risk_index"] > weak["risk_index"]
    assert abs(sum(good["probabilities"].values()) - 1) < 0.01
    assert weak["suggestions"] and "estimate" in weak["disclaimer"]


def test_validation(client):
    _, h = register(client)
    r = client.post("/api/predict", json={**GOOD, "attendance": 140, "study_hours": "x"}, headers=h)
    assert r.status_code == 400 and {"attendance", "study_hours"} <= set(r.json["fields"])
    assert client.post("/api/predict", json=GOOD).status_code == 401


def test_assessment_history_and_access_control(client):
    _, s1 = register(client, email="a@example.com")
    _, s2 = register(client, email="b@example.com")
    body = {**WEAK, "term_label": "Mid-term", "subjects": [
        {"name": "Maths", "marks": 30}, {"name": "English", "marks": 82}]}
    r = client.post("/api/assessments", json=body, headers=s1)
    assert r.status_code == 201
    aid = r.json["assessment"]["id"]
    statuses = {x["name"]: x["status"] for x in r.json["assessment"]["result"]["subjects"]}
    assert statuses == {"Maths": "weakness", "English": "strength"}
    assert len(client.get("/api/assessments", headers=s1).json["assessments"]) == 1
    assert client.get(f"/api/assessments/{aid}", headers=s2).status_code == 404


def test_teacher_endpoints(client):
    _, s = register(client, email="a@example.com")
    client.post("/api/assessments", json=WEAK, headers=s)
    _, t = register(client, "teacher", "t@example.com", invite_code="TEACH-2025")
    assert client.get("/api/teacher/students", headers=s).status_code == 403
    students = client.get("/api/teacher/students", headers=t).json["students"]
    assert students[0]["latest"]["category"] in ("At Risk", "Average")
    summary = client.get("/api/teacher/summary", headers=t).json["summary"]
    assert summary["assessed_students"] == 1
    detail = client.get(f"/api/teacher/students/{students[0]['id']}", headers=t)
    assert len(detail.json["assessments"]) == 1
