from app.generators.env_generator import render_env


def test_render_env_includes_step2_keys_when_provided():
    ctx = {
        "jwt_secret": "A" * 64,
        "anon_key": "B" * 32,
        "service_role_key": "C" * 32,
        "dashboard_password": "D" * 16,
    }
    out = render_env(ctx)
    assert "JWT_SECRET=" in out
    assert "ANON_KEY=" in out
    assert "SERVICE_ROLE_KEY=" in out
    assert "DASHBOARD_PASSWORD=" in out


def test_render_env_omits_step2_keys_when_missing():
    ctx = {
        "postgres_password": "X" * 32,
        "smtp_pass": "Y" * 32,
        "site_url": "http://example.com",
    }
    out = render_env(ctx)
    assert "POSTGRES_PASSWORD=" in out
    assert "SMTP_PASS=" in out
    assert "SITE_URL=" in out
    assert "JWT_SECRET=" not in out
    assert "ANON_KEY=" not in out
    assert "SERVICE_ROLE_KEY=" not in out
    assert "DASHBOARD_PASSWORD=" not in out
