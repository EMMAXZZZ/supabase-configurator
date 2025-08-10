from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

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
print("STATUS:", r.status_code)
print("----- RESPONSE START -----")
print(r.text)
print("----- RESPONSE END -----")
with open("debug_step2_invalid.html", "w", encoding="utf-8") as f:
    f.write(r.text)
