from fastapi.testclient import TestClient

from app.main import app
from app.utils.character_sets import generate_tier1_token

client = TestClient(app)


def test_step1_get_ok():
    r = client.get("/form/step1")
    assert r.status_code == 200
    assert "Step 1: Basic Configuration" in r.text


def test_step1_post_generate_populates_missing_fields():
    # Leave passwords empty and request generation
    r = client.post(
        "/form/step1",
        data={
            "site_url": "http://example.com",
            "postgres_password": "",
            "smtp_pass": "",
            "action": "generate",
        },
    )
    assert r.status_code == 200
    # Expect no validation errors block or empty errors
    assert "Validation Errors" not in r.text


def test_step1_post_preview_invalid_password_length_shows_error():
    r = client.post(
        "/form/step1",
        data={
            "site_url": "http://example.com",
            "postgres_password": "short",
            "smtp_pass": "short",
            "action": "preview",
        },
    )
    assert r.status_code == 200
    assert "Postgres password must be at least 32 characters long" in r.text
    assert "SMTP password must be at least 32 characters long" in r.text


def test_step1_post_preview_ok_renders_env_preview():
    pw = generate_tier1_token(32)
    sp = generate_tier1_token(32)
    r = client.post(
        "/form/step1",
        data={
            "site_url": "http://example.com",
            "postgres_password": pw,
            "smtp_pass": sp,
            "action": "preview",
        },
    )
    assert r.status_code == 200
    # Expect to see .env preview content markers
    assert "POSTGRES_PASSWORD=" in r.text
    assert "SMTP_PASS=" in r.text
    assert "SITE_URL=" in r.text
