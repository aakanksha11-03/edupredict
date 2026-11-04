import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from ml.train import train  # noqa: E402


@pytest.fixture(scope="session")
def model_dir(tmp_path_factory):
    d = tmp_path_factory.mktemp("model")
    train(d, n=1200)
    return str(d)


@pytest.fixture()
def client(model_dir):
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                      "MODEL_DIR": model_dir, "SECRET_KEY": "test-secret-key-that-is-at-least-32-bytes-long"})
    return app.test_client()


def register(client, role="student", email="s@example.com", **extra):
    body = {"name": "Test User", "email": email, "password": "password123", "role": role, **extra}
    r = client.post("/api/auth/register", json=body)
    return r, {"Authorization": f"Bearer {r.json['token']}"} if r.status_code == 201 else {}
