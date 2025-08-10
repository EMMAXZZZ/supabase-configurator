from app.generators.compose_generator import render_compose


def test_compose_template_includes_step2_preview_comments():
    out = render_compose({})
    assert "Security & Authentication (Step 2)" in out
    assert "# JWT_SECRET=${JWT_SECRET}" in out
    assert "# ANON_KEY=${ANON_KEY}" in out
    assert "# SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}" in out
    assert "# DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}" in out
