from fastapi.testclient import TestClient

from app.main import app
from app.utils.character_sets import generate_tier2_token

client = TestClient(app)


def test_step2_get_ok():
    r = client.get("/form/step2")
    assert r.status_code == 200
    assert "Step 2: Security & Authentication" in r.text


def test_step2_post_generate_populates_missing_fields():
    r = client.post(
        "/form/step2",
        data={
            "jwt_secret": "",
            "anon_key": "",
            "service_role_key": "",
            "dashboard_password": "",
            "action": "generate",
        },
    )
    assert r.status_code == 200
    # Should re-render without validation errors
    assert "Validation Errors" not in r.text


def test_step2_post_preview_invalid_shows_errors():
    r = client.post(
        "/form/step2",
        data={
            "jwt_secret": "too_short",
            "anon_key": "short",
            "service_role_key": "bad+chars",
            "dashboard_password": "short",
            "action": "preview",
        },
    )
    assert r.status_code == 200
    # Assert presence of field labels in Validation Errors block (message text can vary)
    assert "Validation Errors" in r.text
    assert "jwt_secret:" in r.text
    assert "anon_key:" in r.text
    assert "service_role_key:" in r.text
    assert "dashboard_password:" in r.text


def test_step2_post_preview_ok_renders_security_preview():
    jwt = generate_tier2_token(64)
    anon = generate_tier2_token(32)
    srv = generate_tier2_token(32)
    r = client.post(
        "/form/step2",
        data={
            "jwt_secret": jwt,
            "anon_key": anon,
            "service_role_key": srv,
            "dashboard_password": "",  # optional
            "action": "preview",
        },
    )
    assert r.status_code == 200
    assert "JWT_SECRET=" in r.text
    assert "ANON_KEY=" in r.text
    assert "SERVICE_ROLE_KEY=" in r.text
